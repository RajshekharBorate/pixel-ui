import { Injectable, computed, inject, signal } from '@angular/core';
import { PixelUploadService } from './upload.service';
import { PixelDownloadService } from './download.service';
import type { PixelDownloadOptions, PixelUploadOptions } from './file-transfer.types';
import { pixelTransferId } from './utils/file-utils';

/** A download intent persisted across reloads (URL-based, fully serialisable). */
interface PersistedDownloadIntent {
  readonly id: string;
  readonly url: string;
  readonly fileName?: string;
  readonly options: PixelDownloadOptions;
}

/** An upload intent held in memory only (File objects can't survive a reload). */
interface PendingUploadIntent {
  readonly id: string;
  readonly file: File;
  readonly options: PixelUploadOptions;
}

const STORAGE_KEY = 'pixel.file-transfer.offline-downloads';

/**
 * Opt-in offline queue. When the browser is offline, transfers are held and replayed
 * automatically on reconnect (`window 'online'`).
 *
 * - **Downloads** are URL-based and serialisable, so they persist to `localStorage`
 *   and survive a full page reload.
 * - **Uploads** carry a live `File` (not serialisable), so they're queued in memory
 *   and replayed within the same session only.
 *
 * Usage — route transfers through this service instead of calling upload/download
 * directly when you want offline resilience:
 *
 * ```ts
 * offline.upload(file, { url: '/api/upload' });   // runs now if online, else queued
 * offline.download('/api/report.pdf');            // persisted if offline
 * ```
 */
@Injectable({ providedIn: 'root' })
export class PixelOfflineQueueService {
  private readonly uploads = inject(PixelUploadService);
  private readonly downloads = inject(PixelDownloadService);

  private readonly _online = signal(this.readOnline());
  readonly online = this._online.asReadonly();
  readonly offline = computed(() => !this._online());

  private pendingUploads: PendingUploadIntent[] = [];
  private readonly _pendingCount = signal(0);
  /** Number of transfers waiting for connectivity (uploads in memory + persisted downloads). */
  readonly pendingCount = this._pendingCount.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onOnline);
      window.addEventListener('offline', this.onOffline);
    }
    this.refreshCount();
    // Replay anything persisted from a previous session if we're already online.
    if (this._online()) queueMicrotask(() => this.flush());
  }

  /** Upload now when online; otherwise hold in memory and replay on reconnect. */
  upload(file: File, options: PixelUploadOptions = {}): string {
    if (this._online()) return this.uploads.upload(file, options);
    const id = pixelTransferId('off-up');
    this.pendingUploads.push({ id, file, options });
    this.refreshCount();
    return id;
  }

  /** Download now when online; otherwise persist (survives reload) and replay later. */
  download(url: string, options: PixelDownloadOptions = {}): string {
    if (this._online()) return this.downloads.download(url, options);
    const id = pixelTransferId('off-dl');
    const intents = this.readPersisted();
    intents.push({ id, url, fileName: options.fileName, options });
    this.writePersisted(intents);
    this.refreshCount();
    return id;
  }

  /** Manually replay all queued transfers (also runs automatically on reconnect). */
  flush(): void {
    // Uploads (in-memory).
    const ups = this.pendingUploads;
    this.pendingUploads = [];
    ups.forEach((i) => this.uploads.upload(i.file, i.options));

    // Downloads (persisted).
    const dls = this.readPersisted();
    this.clearPersisted();
    dls.forEach((i) => this.downloads.download(i.url, { ...i.options, fileName: i.fileName }));

    this.refreshCount();
  }

  /** Drop all queued intents without replaying. */
  clear(): void {
    this.pendingUploads = [];
    this.clearPersisted();
    this.refreshCount();
  }

  /** Detach window listeners (call from a host component's ngOnDestroy if needed). */
  dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onOnline);
      window.removeEventListener('offline', this.onOffline);
    }
  }

  // ── Internals ───────────────────────────────────────────────────────────────

  private readonly onOnline = (): void => {
    this._online.set(true);
    this.flush();
  };

  private readonly onOffline = (): void => {
    this._online.set(false);
  };

  private readOnline(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }

  private refreshCount(): void {
    this._pendingCount.set(this.pendingUploads.length + this.readPersisted().length);
  }

  private readPersisted(): PersistedDownloadIntent[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PersistedDownloadIntent[];
    } catch {
      return [];
    }
  }

  private writePersisted(intents: PersistedDownloadIntent[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(intents));
    } catch {
      /* quota / unavailable — ignore */
    }
  }

  private clearPersisted(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
