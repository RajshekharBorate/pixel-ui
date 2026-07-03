import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, Subject, Subscription, timeout } from 'rxjs';
import {
  PIXEL_FILE_TRANSFER_CONFIG,
  PIXEL_UPLOAD_ADAPTER,
} from './file-transfer.tokens';
import { PixelRestAdapter } from './adapters/rest-adapter';
import type { PixelUploadAdapter } from './adapters/upload-adapter.interface';
import {
  PIXEL_FILE_TRANSFER_DEFAULTS,
  type PixelUploadFile,
  type PixelUploadOptions,
  type PixelUploadResponse,
  type PixelUploadTask,
  type PixelUploadValidator,
  type ResolvedFileTransferConfig,
} from './file-transfer.types';
import { backoffDelay, pixelTransferId, toTransferError } from './utils/file-utils';
import { isFileAccepted } from './utils/accept.util';

/**
 * Manages the upload queue: validation, concurrency-limited processing, progress,
 * retry (exponential backoff), and pause / resume / cancel — all signal-driven.
 *
 * Adapter-agnostic: the actual transfer is delegated to a `PixelUploadAdapter`
 * (default `PixelRestAdapter`, override via `PIXEL_UPLOAD_ADAPTER`).
 */
@Injectable({ providedIn: 'root' })
export class PixelUploadService {
  private readonly cfgInput = inject(PIXEL_FILE_TRANSFER_CONFIG, { optional: true });
  private readonly adapter: PixelUploadAdapter =
    inject(PIXEL_UPLOAD_ADAPTER, { optional: true }) ?? inject(PixelRestAdapter);

  private readonly cfg: ResolvedFileTransferConfig = {
    ...PIXEL_FILE_TRANSFER_DEFAULTS,
    ...(this.cfgInput ?? {}),
  };

  /** Live subscriptions per task id (used for cancel / pause). */
  private readonly subs = new Map<string, Subscription>();
  /**
   * Resumable chunk state per task id — survives pause so resume continues mid-file.
   * `done` tracks completed chunks (any order), enabling bounded-parallel chunk uploads.
   */
  private readonly chunkState = new Map<
    string,
    {
      total: number;
      done: boolean[];
      inFlight: Set<number>;
      active: number;
      failed: boolean;
      finalResponse?: PixelUploadResponse;
    }
  >();

  // ── State ───────────────────────────────────────────────────────────────────
  private readonly _tasks = signal<readonly PixelUploadTask[]>([]);
  readonly tasks = this._tasks.asReadonly();

  readonly activeCount = computed(
    () => this._tasks().filter((t) => t.status === 'uploading' || t.status === 'validating').length,
  );
  readonly completed = computed(() => this._tasks().filter((t) => t.status === 'completed'));
  readonly failed = computed(() => this._tasks().filter((t) => t.status === 'failed'));
  readonly totalProgress = computed(() => {
    const list = this._tasks();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, t) => sum + t.progress, 0) / list.length);
  });

  // ── Observability streams ─────────────────────────────────────────────────────
  readonly uploadStarted$   = new Subject<PixelUploadTask>();
  readonly uploadProgress$  = new Subject<PixelUploadTask>();
  readonly uploadCompleted$ = new Subject<PixelUploadTask>();
  readonly uploadFailed$    = new Subject<PixelUploadTask>();

  /** Optional custom validators run before queuing. */
  private validators: PixelUploadValidator[] = [];
  setValidators(validators: PixelUploadValidator[]): void {
    this.validators = validators;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Queue a single file. Returns the created task id. */
  upload(file: File, options: PixelUploadOptions = {}): string {
    const id = pixelTransferId('up');
    const uploadFile: PixelUploadFile = {
      id,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      metadata: options.metadata,
    };

    const error = this.validate(file);
    const now = Date.now();
    const task: PixelUploadTask = {
      id,
      file: uploadFile,
      progress: 0,
      status: error ? 'failed' : 'queued',
      error: error ?? undefined,
      attempts: 0,
      priority: options.priority ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this._tasks.update((list) => [...list, task]);
    if (error) this.uploadFailed$.next(task);
    else this.pump(options);
    return id;
  }

  /** Queue many files at once. Returns all created task ids. */
  uploadMany(files: readonly File[], options: PixelUploadOptions = {}): string[] {
    return files.map((f) => this.upload(f, options));
  }

  pauseUpload(id: string): void {
    this.tearDown(id);
    this.patch(id, { status: 'paused' });
  }

  resumeUpload(id: string, options: PixelUploadOptions = {}): void {
    const t = this.find(id);
    if (!t || t.status !== 'paused') return;
    this.patch(id, { status: 'queued', progress: 0 });
    this.pump(options);
  }

  retryUpload(id: string, options: PixelUploadOptions = {}): void {
    const t = this.find(id);
    if (!t || (t.status !== 'failed' && t.status !== 'cancelled')) return;
    this.patch(id, { status: 'queued', progress: 0, error: undefined });
    this.pump(options);
  }

  cancelUpload(id: string): void {
    this.tearDown(id);
    this.chunkState.delete(id); // a retry after cancel restarts from chunk 0
    this.patch(id, { status: 'cancelled' });
  }

  cancelAll(): void {
    this._tasks().forEach((t) => {
      if (t.status === 'uploading' || t.status === 'queued') this.cancelUpload(t.id);
    });
  }

  removeUpload(id: string): void {
    this.tearDown(id);
    this.chunkState.delete(id);
    this._tasks.update((list) => list.filter((t) => t.id !== id));
  }

  clearCompleted(): void {
    this._tasks.update((list) => list.filter((t) => t.status !== 'completed'));
  }

  // ── Queue pump ──────────────────────────────────────────────────────────────

  private pump(options: PixelUploadOptions): void {
    const running = this.activeCount();
    const slots = this.cfg.parallelUploads - running;
    if (slots <= 0) return;

    // Priority-ordered: higher priority first, then FIFO by creation time.
    const queued = this._tasks()
      .filter((t) => t.status === 'queued')
      .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)
      .slice(0, slots);
    queued.forEach((t) => this.start(t, options));
  }

  private start(task: PixelUploadTask, options: PixelUploadOptions): void {
    const url = options.url ?? this.cfg.uploadUrl;
    const merged: PixelUploadOptions = {
      ...options,
      url,
      withCredentials: options.withCredentials ?? this.cfg.withCredentials,
      headers: { ...this.cfg.headers, ...options.headers },
    };

    // Route large files to the chunked/resumable path when the adapter and config allow it.
    if (this.shouldChunk(task)) {
      this.startChunked(task, merged, options);
      return;
    }

    this.patch(task.id, { status: 'uploading', progress: 0 });
    const started = this.find(task.id);
    if (started) this.uploadStarted$.next(started);

    const sub = this.applyTimeout(this.adapter.upload(task.file, merged)).subscribe({
      next: (ev) => {
        if (ev.done) {
          this.patch(task.id, { status: 'completed', progress: 100, response: ev.response });
          const done = this.find(task.id);
          if (done) this.uploadCompleted$.next(done);
          this.cleanup(task.id);
          this.pump(options);
        } else {
          // Skip redundant updates when the rounded percent hasn't moved.
          const cur = this.find(task.id);
          if (cur && cur.progress !== ev.progress) {
            this.patch(task.id, { progress: ev.progress });
            const prog = this.find(task.id);
            if (prog) this.uploadProgress$.next(prog);
          }
        }
      },
      error: (err) => this.handleError(task.id, err, options),
    });
    this.subs.set(task.id, sub);
  }

  private handleError(id: string, err: unknown, options: PixelUploadOptions): void {
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
    if (failed) this.uploadFailed$.next(failed);
    this.pump(options);
  }

  // ── Chunked / resumable upload ────────────────────────────────────────────────

  private shouldChunk(task: PixelUploadTask): boolean {
    return (
      !!this.cfg.chunkUpload &&
      typeof this.adapter.uploadChunk === 'function' &&
      task.file.size > this.cfg.chunkSize
    );
  }

  private startChunked(task: PixelUploadTask, merged: PixelUploadOptions, raw: PixelUploadOptions): void {
    const total = Math.ceil(task.file.size / this.cfg.chunkSize);
    let state = this.chunkState.get(task.id);
    if (!state) {
      state = { total, done: new Array(total).fill(false), inFlight: new Set(), active: 0, failed: false };
      this.chunkState.set(task.id, state);
    } else {
      // Resuming: any chunks that were in flight at pause were torn down — reset transient fields.
      state.inFlight = new Set();
      state.active = 0;
      state.failed = false;
    }

    this.patch(task.id, { status: 'uploading' });
    const started = this.find(task.id);
    if (started) this.uploadStarted$.next(started);

    // A parent subscription holds every concurrent chunk request so pause/cancel tears them all down.
    const parent = new Subscription();
    this.subs.set(task.id, parent);

    // Already complete (e.g. resume after the final chunk landed)?
    if (state.done.every(Boolean)) { this.finalizeChunked(task.id, raw); return; }
    this.pumpChunks(task, merged, raw, parent);
  }

  /** Starts up to `parallelChunks` concurrent chunk uploads, picking undone chunks. */
  private pumpChunks(
    task: PixelUploadTask,
    merged: PixelUploadOptions,
    raw: PixelUploadOptions,
    parent: Subscription,
  ): void {
    const state = this.chunkState.get(task.id);
    if (!state || state.failed) return;
    const current = this.find(task.id);
    if (!current || current.status !== 'uploading') return; // paused / cancelled

    const cs = this.cfg.chunkSize;

    while (state.active < this.cfg.parallelChunks) {
      const index = state.done.findIndex((d, i) => !d && !state.inFlight.has(i));
      if (index < 0) break; // nothing left to start
      state.inFlight.add(index);
      state.active++;

      const start = index * cs;
      const end = Math.min(start + cs, task.file.size);
      const chunk = task.file.file.slice(start, end);

      const sub = this.applyTimeout(this.adapter.uploadChunk!(task.file, chunk, index, state.total, merged))
        .subscribe({
          next: (ev) => {
            if (!ev.done) return;
            state.done[index] = true;
            state.inFlight.delete(index);
            state.active--;
            if (index === state.total - 1) state.finalResponse = ev.response;

            const doneCount = state.done.reduce((n, d) => n + (d ? 1 : 0), 0);
            const pct = Math.round((doneCount / state.total) * 100);
            const cur = this.find(task.id);
            if (cur && cur.progress !== pct) {
              this.patch(task.id, { progress: pct });
              const prog = this.find(task.id);
              if (prog) this.uploadProgress$.next(prog);
            }

            if (state.done.every(Boolean)) this.finalizeChunked(task.id, raw);
            else this.pumpChunks(task, merged, raw, parent);
          },
          error: (err) => {
            if (state.failed) return;
            state.failed = true;
            parent.unsubscribe();      // stop sibling chunk requests
            this.subs.delete(task.id);
            this.handleError(task.id, err, raw); // chunkState kept → retry/resume reuses done[]
          },
        });
      parent.add(sub);
    }
  }

  private finalizeChunked(id: string, raw: PixelUploadOptions): void {
    const state = this.chunkState.get(id);
    this.patch(id, { status: 'completed', progress: 100, response: state?.finalResponse });
    const done = this.find(id);
    if (done) this.uploadCompleted$.next(done);
    this.chunkState.delete(id);
    this.cleanup(id);
    this.pump(raw);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private validate(file: File): ReturnType<typeof toTransferError> | null {
    if (this.cfg.maxFileSize && file.size > this.cfg.maxFileSize) {
      return { kind: 'validation', message: `File exceeds max size of ${this.cfg.maxFileSize} bytes` };
    }
    if (this.cfg.acceptedTypes && !isFileAccepted(file, this.cfg.acceptedTypes)) {
      return { kind: 'validation', message: `File type not allowed (${this.cfg.acceptedTypes})` };
    }
    if (this.cfg.maxFiles && this._tasks().length >= this.cfg.maxFiles) {
      return { kind: 'validation', message: `Maximum ${this.cfg.maxFiles} files allowed` };
    }
    for (const v of this.validators) {
      const msg = v(file);
      if (msg) return { kind: 'validation', message: msg };
    }
    return null;
  }

  /** Applies an idle timeout (resets on each progress event) when configured. */
  private applyTimeout<T>(obs: Observable<T>): Observable<T> {
    const ms = this.cfg.timeout ?? 0;
    return ms > 0 ? obs.pipe(timeout({ each: ms })) : obs;
  }

  private find(id: string): PixelUploadTask | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  /**
   * Updates one task. Uses a shallow array copy + single-element replace (not `.map()`),
   * so a progress tick allocates exactly one new task object — not N — which keeps
   * frequent progress updates O(1) in allocations even with thousands of queued files.
   */
  private patch(id: string, patch: Partial<PixelUploadTask>): void {
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
  }

  private cleanup(id: string): void {
    this.subs.delete(id);
  }
}
