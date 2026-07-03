import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, Subject, Subscription, firstValueFrom, timeout } from 'rxjs';
import {
  PIXEL_FILE_TRANSFER_CONFIG,
  PIXEL_DOWNLOAD_ADAPTER,
} from './file-transfer.tokens';
import { PixelRestAdapter } from './adapters/rest-adapter';
import type { PixelDownloadAdapter } from './adapters/download-adapter.interface';
import {
  PIXEL_FILE_TRANSFER_DEFAULTS,
  type PixelDownloadFile,
  type PixelDownloadOptions,
  type PixelDownloadTask,
  type ResolvedFileTransferConfig,
} from './file-transfer.types';
import {
  backoffDelay,
  fileNameFromUrl,
  pixelTransferId,
  saveBlob,
  toTransferError,
} from './utils/file-utils';

/**
 * Manages the download queue: concurrency-limited processing, progress, retry,
 * pause / resume / cancel, plus blob, bulk, and ZIP helpers — all signal-driven.
 */
@Injectable({ providedIn: 'root' })
export class PixelDownloadService {
  private readonly cfgInput = inject(PIXEL_FILE_TRANSFER_CONFIG, { optional: true });
  private readonly adapter: PixelDownloadAdapter =
    inject(PIXEL_DOWNLOAD_ADAPTER, { optional: true }) ?? inject(PixelRestAdapter);

  private readonly cfg: ResolvedFileTransferConfig = {
    ...PIXEL_FILE_TRANSFER_DEFAULTS,
    ...(this.cfgInput ?? {}),
  };

  private readonly subs = new Map<string, Subscription>();
  /** AbortControllers for fetch-based streaming downloads (cancel support). */
  private readonly aborts = new Map<string, AbortController>();
  /** Completed range Blobs per task — preserved across pause so resume skips done ranges. */
  private readonly rangeParts = new Map<string, (Blob | null)[]>();

  // ── State ───────────────────────────────────────────────────────────────────
  private readonly _tasks = signal<readonly PixelDownloadTask[]>([]);
  readonly tasks = this._tasks.asReadonly();

  readonly activeCount = computed(() => this._tasks().filter((t) => t.status === 'downloading').length);
  readonly completed = computed(() => this._tasks().filter((t) => t.status === 'completed'));
  readonly failed = computed(() => this._tasks().filter((t) => t.status === 'failed'));
  readonly totalProgress = computed(() => {
    const list = this._tasks();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, t) => sum + Math.max(0, t.progress), 0) / list.length);
  });

  // ── Observability streams ─────────────────────────────────────────────────────
  readonly downloadStarted$   = new Subject<PixelDownloadTask>();
  readonly downloadProgress$  = new Subject<PixelDownloadTask>();
  readonly downloadCompleted$ = new Subject<PixelDownloadTask>();
  readonly downloadFailed$    = new Subject<PixelDownloadTask>();

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Queue a download from a URL (or a full PixelDownloadFile). Returns the task id. */
  download(source: string | PixelDownloadFile, options: PixelDownloadOptions = {}): string {
    const file: PixelDownloadFile =
      typeof source === 'string'
        ? { id: pixelTransferId('dl'), url: source, fileName: options.fileName ?? fileNameFromUrl(source) }
        : source;

    const now = Date.now();
    const task: PixelDownloadTask = {
      id: file.id || pixelTransferId('dl'),
      file,
      progress: 0,
      status: 'queued',
      attempts: 0,
      priority: options.priority ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this._tasks.update((list) => [...list, task]);
    this.pump(options);
    return task.id;
  }

  /** Queue multiple downloads. Returns all task ids. */
  downloadMany(sources: readonly (string | PixelDownloadFile)[], options: PixelDownloadOptions = {}): string[] {
    return sources.map((s) => this.download(s, options));
  }

  /**
   * Download a single resource and return its Blob without saving to disk.
   * Useful for in-app PDF/CSV/image preview.
   */
  async downloadBlob(source: string | PixelDownloadFile, options: PixelDownloadOptions = {}): Promise<Blob> {
    const file: PixelDownloadFile =
      typeof source === 'string'
        ? { id: pixelTransferId('dl'), url: source, fileName: options.fileName ?? fileNameFromUrl(source) }
        : source;
    const merged = this.mergeOptions({ ...options, noSave: true });
    const event = await firstValueFrom(this.adapter.download(file, merged));
    return event.blob ?? new Blob();
  }

  /**
   * Fetch multiple files and bundle them into a single ZIP, then save it.
   * Requires a `zipper` fn (e.g. backed by JSZip) so the library stays dependency-free:
   *
   * ```ts
   * downloadService.downloadZip(files, 'attachments.zip', async (entries) => {
   *   const zip = new JSZip();
   *   entries.forEach(e => zip.file(e.name, e.blob));
   *   return zip.generateAsync({ type: 'blob' });
   * });
   * ```
   */
  async downloadZip(
    sources: readonly (string | PixelDownloadFile)[],
    zipFileName: string,
    zipper: (entries: { name: string; blob: Blob }[]) => Promise<Blob>,
    options: PixelDownloadOptions = {},
  ): Promise<void> {
    // Fetch with bounded concurrency (parallelDownloads) instead of one big Promise.all,
    // preserving source order in the resulting entries.
    const entries = await this.mapLimit(sources, this.cfg.parallelDownloads, async (s) => {
      const file: PixelDownloadFile =
        typeof s === 'string'
          ? { id: pixelTransferId('dl'), url: s, fileName: fileNameFromUrl(s) }
          : s;
      const blob = await this.downloadBlob(file, options);
      return { name: file.fileName, blob };
    });
    const zip = await zipper(entries);
    saveBlob(zip, zipFileName);
  }

  /** Runs an async mapper over items with at most `limit` in flight; keeps input order. */
  private async mapLimit<T, R>(
    items: readonly T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    const results = new Array<R>(items.length);
    let cursor = 0;
    const worker = async (): Promise<void> => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await fn(items[i], i);
      }
    };
    const pool = Array.from({ length: Math.max(1, limit) }, () => worker());
    await Promise.all(pool);
    return results;
  }

  pauseDownload(id: string): void {
    this.tearDown(id);
    this.patch(id, { status: 'paused' });
  }

  resumeDownload(id: string, options: PixelDownloadOptions = {}): void {
    const t = this.find(id);
    if (!t || t.status !== 'paused') return;
    this.patch(id, { status: 'queued', progress: 0 });
    this.pump(options);
  }

  retryDownload(id: string, options: PixelDownloadOptions = {}): void {
    const t = this.find(id);
    if (!t || (t.status !== 'failed' && t.status !== 'cancelled')) return;
    this.patch(id, { status: 'queued', progress: 0, error: undefined });
    this.pump(options);
  }

  cancelDownload(id: string): void {
    this.tearDown(id);
    this.rangeParts.delete(id); // a retry after cancel re-downloads all ranges
    this.patch(id, { status: 'cancelled' });
  }

  cancelAll(): void {
    this._tasks().forEach((t) => {
      if (t.status === 'downloading' || t.status === 'queued') this.cancelDownload(t.id);
    });
  }

  removeDownload(id: string): void {
    this.tearDown(id);
    this.rangeParts.delete(id);
    this._tasks.update((list) => list.filter((t) => t.id !== id));
  }

  clearCompleted(): void {
    this._tasks.update((list) => list.filter((t) => t.status !== 'completed'));
  }

  // ── Queue pump ──────────────────────────────────────────────────────────────

  private pump(options: PixelDownloadOptions): void {
    const slots = this.cfg.parallelDownloads - this.activeCount();
    if (slots <= 0) return;
    this._tasks()
      .filter((t) => t.status === 'queued')
      .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)
      .slice(0, slots)
      .forEach((t) => this.start(t, options));
  }

  private start(task: PixelDownloadTask, options: PixelDownloadOptions): void {
    // Download-size validation (when known up front).
    if (this.cfg.maxDownloadSize && task.file.size && task.file.size > this.cfg.maxDownloadSize) {
      this.patch(task.id, {
        status: 'failed',
        error: { kind: 'validation', message: `Exceeds max download size of ${this.cfg.maxDownloadSize} bytes` },
      });
      const f = this.find(task.id);
      if (f) this.downloadFailed$.next(f);
      this.pump(options);
      return;
    }

    const merged = this.mergeOptions(options);

    // Route large, sized files to ranged parallel download when adapter + config allow.
    if (this.shouldChunkDownload(task)) {
      this.startRanged(task, merged, options);
      return;
    }

    this.patch(task.id, { status: 'downloading', progress: 0 });
    const started = this.find(task.id);
    if (started) this.downloadStarted$.next(started);

    const sub = this.applyTimeout(this.adapter.download(task.file, merged)).subscribe({
      next: (ev) => {
        if (ev.done) {
          this.patch(task.id, { status: 'completed', progress: 100, blob: ev.blob });
          if (!merged.noSave && ev.blob) saveBlob(ev.blob, merged.fileName ?? task.file.fileName);
          const done = this.find(task.id);
          if (done) this.downloadCompleted$.next(done);
          this.cleanup(task.id);
          this.pump(options);
        } else {
          const cur = this.find(task.id);
          if (cur && cur.progress !== ev.progress) {
            this.patch(task.id, { progress: ev.progress });
            const prog = this.find(task.id);
            if (prog) this.downloadProgress$.next(prog);
          }
        }
      },
      error: (err) => this.handleError(task.id, err, options),
    });
    this.subs.set(task.id, sub);
  }

  private handleError(id: string, err: unknown, options: PixelDownloadOptions): void {
    const t = this.find(id);
    if (!t) return;
    const attempts = t.attempts + 1;
    const error = toTransferError(err);
    this.cleanup(id);

    if (this.cfg.autoRetry && attempts <= this.cfg.retryCount && error.kind !== 'aborted') {
      this.patch(id, { status: 'queued', attempts, error: undefined });
      setTimeout(() => this.pump(options), backoffDelay(attempts - 1, this.cfg.retryDelay));
      return;
    }
    this.patch(id, { status: 'failed', attempts, error });
    const failed = this.find(id);
    if (failed) this.downloadFailed$.next(failed);
    this.pump(options);
  }

  // ── Ranged parallel download ───────────────────────────────────────────────────

  private shouldChunkDownload(task: PixelDownloadTask): boolean {
    return (
      !!this.cfg.chunkDownload &&
      typeof this.adapter.downloadChunk === 'function' &&
      !!task.file.size &&
      task.file.size > this.cfg.chunkSize
    );
  }

  /**
   * Splits a known-size file into byte ranges and downloads them with bounded
   * parallelism, then assembles the parts (in order) into one Blob and saves.
   * A single failed range fails the task (which retry / autoRetry can re-drive).
   */
  private startRanged(task: PixelDownloadTask, merged: PixelDownloadOptions, raw: PixelDownloadOptions): void {
    const size = task.file.size!;
    const cs = this.cfg.chunkSize;
    const count = Math.ceil(size / cs);

    // Reuse parts from a prior (paused) attempt so completed ranges aren't re-fetched.
    const parts = this.rangeParts.get(task.id) ?? new Array<Blob | null>(count).fill(null);
    this.rangeParts.set(task.id, parts);

    this.patch(task.id, { status: 'downloading' });
    const started = this.find(task.id);
    if (started) this.downloadStarted$.next(started);

    const parent = new Subscription();
    this.subs.set(task.id, parent);

    // Indices still to fetch (null parts), in order.
    const queue = parts.map((p, i) => (p === null ? i : -1)).filter((i) => i >= 0);
    let qcursor = 0;
    let active = 0;
    let completed = parts.filter((p) => p !== null).length;
    let failed = false;

    const finish = (): void => {
      const blob = new Blob(parts.filter((p): p is Blob => p !== null));
      this.patch(task.id, { status: 'completed', progress: 100, blob });
      if (!merged.noSave) saveBlob(blob, merged.fileName ?? task.file.fileName);
      const done = this.find(task.id);
      if (done) this.downloadCompleted$.next(done);
      this.rangeParts.delete(task.id);
      this.cleanup(task.id);
      this.pump(raw);
    };

    if (completed === count) { finish(); return; }
    this.patch(task.id, { progress: Math.round((completed / count) * 100) });

    const pumpRanges = (): void => {
      while (active < this.cfg.parallelDownloads && qcursor < queue.length && !failed) {
        const index = queue[qcursor++];
        active++;
        const start = index * cs;
        const end = Math.min(start + cs, size) - 1;

        const sub = this.applyTimeout(this.adapter.downloadChunk!(task.file, start, end, merged)).subscribe({
          next: (ev) => {
            if (ev.done && ev.blob) {
              parts[index] = ev.blob;
              completed++;
              active--;
              this.patch(task.id, { progress: Math.round((completed / count) * 100) });
              const prog = this.find(task.id);
              if (prog) this.downloadProgress$.next(prog);

              if (completed === count) finish();
              else pumpRanges();
            }
          },
          error: (err) => {
            if (!failed) {
              failed = true;
              parent.unsubscribe(); // stop sibling range requests
              this.handleError(task.id, err, raw);
            }
          },
        });
        parent.add(sub);
      }
    };

    pumpRanges();
  }

  // ── True streaming download (fetch + ReadableStream) ─────────────────────────────

  /**
   * Streams a download without buffering the whole response through a growing XHR.
   * When the File System Access API is available (and not suppressed), writes chunks
   * straight to disk via a WritableStream for near-constant memory — suitable for
   * very large files (500 MB – 10 GB+). Otherwise falls back to a Blob + saveAs.
   *
   * Returns the created task id. Cancellable via `cancelDownload(id)`.
   */
  async downloadStream(source: string | PixelDownloadFile, options: PixelDownloadOptions = {}): Promise<string> {
    const file: PixelDownloadFile =
      typeof source === 'string'
        ? { id: pixelTransferId('dl'), url: source, fileName: options.fileName ?? fileNameFromUrl(source) }
        : source;

    const now = Date.now();
    const task: PixelDownloadTask = {
      id: file.id || pixelTransferId('dl'),
      file,
      progress: 0,
      status: 'downloading',
      attempts: 0,
      priority: options.priority ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this._tasks.update((list) => [...list, task]);
    this.downloadStarted$.next(task);

    const controller = new AbortController();
    this.aborts.set(task.id, controller);
    const merged = this.mergeOptions(options);

    try {
      const res = await fetch(file.url, {
        signal: controller.signal,
        credentials: merged.withCredentials ? 'include' : 'same-origin',
        headers: merged.headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('ReadableStream not supported by response');

      const total = Number(res.headers.get('Content-Length')) || file.size || 0;
      const reader = res.body.getReader();

      // Prefer streaming straight to disk when the picker API exists and saving is wanted.
      const writer = await this.openDiskWriter(file.fileName, merged);
      const buffered: Uint8Array[] = [];
      let loaded = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        loaded += value.byteLength;
        if (writer) await writer.write(value);
        else buffered.push(value);
        if (total) {
          this.patch(task.id, { progress: Math.round((loaded / total) * 100) });
          const prog = this.find(task.id);
          if (prog) this.downloadProgress$.next(prog);
        }
      }

      if (writer) {
        await writer.close();
        this.patch(task.id, { status: 'completed', progress: 100 });
      } else {
        const blob = new Blob(buffered as BlobPart[], { type: file.type });
        this.patch(task.id, { status: 'completed', progress: 100, blob });
        if (!merged.noSave) saveBlob(blob, merged.fileName ?? file.fileName);
      }
      const done = this.find(task.id);
      if (done) this.downloadCompleted$.next(done);
    } catch (err) {
      const error = toTransferError(err);
      this.patch(task.id, { status: error.kind === 'aborted' ? 'cancelled' : 'failed', error });
      if (error.kind !== 'aborted') {
        const failed = this.find(task.id);
        if (failed) this.downloadFailed$.next(failed);
      }
    } finally {
      this.aborts.delete(task.id);
    }
    return task.id;
  }

  /** Opens a File System Access writable when available; null otherwise. */
  private async openDiskWriter(
    fileName: string,
    options: PixelDownloadOptions,
  ): Promise<WritableStreamDefaultWriter<Uint8Array> | null> {
    if (options.noSave) return null;
    const picker = (globalThis as { showSaveFilePicker?: (o: unknown) => Promise<FileSystemFileHandle> })
      .showSaveFilePicker;
    if (typeof picker !== 'function') return null;
    try {
      const handle = await picker({ suggestedName: fileName });
      const writable = await handle.createWritable();
      return writable.getWriter() as WritableStreamDefaultWriter<Uint8Array>;
    } catch {
      return null; // user cancelled the picker or API unavailable → fall back to Blob
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private mergeOptions(options: PixelDownloadOptions): PixelDownloadOptions {
    return {
      ...options,
      withCredentials: options.withCredentials ?? this.cfg.withCredentials,
      headers: { ...this.cfg.headers, ...options.headers },
    };
  }

  /** Applies an idle timeout (resets on each progress event) when configured. */
  private applyTimeout<T>(obs: Observable<T>): Observable<T> {
    const ms = this.cfg.timeout ?? 0;
    return ms > 0 ? obs.pipe(timeout({ each: ms })) : obs;
  }

  private find(id: string): PixelDownloadTask | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  /** Single-element replace (see PixelUploadService.patch) — O(1) allocations per tick. */
  private patch(id: string, patch: Partial<PixelDownloadTask>): void {
    const arr = this._tasks();
    const i = arr.findIndex((t) => t.id === id);
    if (i < 0) return;
    const next = arr.slice();
    next[i] = { ...arr[i], ...patch, updatedAt: Date.now() };
    this._tasks.set(next);
  }

  private tearDown(id: string): void {
    this.subs.get(id)?.unsubscribe();
    this.subs.delete(id);
    this.aborts.get(id)?.abort();
    this.aborts.delete(id);
  }

  private cleanup(id: string): void {
    this.subs.delete(id);
  }
}
