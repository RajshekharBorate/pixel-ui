import { Injectable, inject } from '@angular/core';
import { PixelUploadService } from './upload.service';
import { PixelDownloadService } from './download.service';
import { PixelFileTransferStore } from './file-transfer.store';
import type {
  PixelDownloadFile,
  PixelDownloadOptions,
  PixelUploadOptions,
} from './file-transfer.types';

/**
 * Facade over the upload and download services + aggregate store. This is the single
 * entry point most consumers need — inject it from pages, components, services,
 * effects, NgRx, signal stores, or micro-frontends.
 *
 * For finer control, inject `PixelUploadService` / `PixelDownloadService` directly.
 *
 * UI-independent — no template or DOM dependencies. The pixel-file-upload component
 * can delegate its transfers here.
 */
@Injectable({ providedIn: 'root' })
export class PixelFileTransferService {
  /** Direct access to the upload queue service. */
  readonly uploads = inject(PixelUploadService);
  /** Direct access to the download queue service. */
  readonly downloads = inject(PixelDownloadService);
  /** Aggregate read-only signal store. */
  readonly store = inject(PixelFileTransferStore);

  // ── Upload ────────────────────────────────────────────────────────────────────
  upload(file: File, options?: PixelUploadOptions): string {
    return this.uploads.upload(file, options);
  }
  uploadMany(files: readonly File[], options?: PixelUploadOptions): string[] {
    return this.uploads.uploadMany(files, options);
  }

  // ── Download ──────────────────────────────────────────────────────────────────
  download(source: string | PixelDownloadFile, options?: PixelDownloadOptions): string {
    return this.downloads.download(source, options);
  }
  downloadMany(sources: readonly (string | PixelDownloadFile)[], options?: PixelDownloadOptions): string[] {
    return this.downloads.downloadMany(sources, options);
  }
  downloadBlob(source: string | PixelDownloadFile, options?: PixelDownloadOptions): Promise<Blob> {
    return this.downloads.downloadBlob(source, options);
  }
  /** Memory-aware streaming download for very large files (fetch + ReadableStream). */
  downloadStream(source: string | PixelDownloadFile, options?: PixelDownloadOptions): Promise<string> {
    return this.downloads.downloadStream(source, options);
  }
  downloadZip(
    sources: readonly (string | PixelDownloadFile)[],
    zipFileName: string,
    zipper: (entries: { name: string; blob: Blob }[]) => Promise<Blob>,
    options?: PixelDownloadOptions,
  ): Promise<void> {
    return this.downloads.downloadZip(sources, zipFileName, zipper, options);
  }

  // ── Unified controls (route to the correct queue by task id) ─────────────────────
  pause(id: string): void {
    if (this.isUpload(id)) this.uploads.pauseUpload(id);
    else this.downloads.pauseDownload(id);
  }
  resume(id: string): void {
    if (this.isUpload(id)) this.uploads.resumeUpload(id);
    else this.downloads.resumeDownload(id);
  }
  retry(id: string): void {
    if (this.isUpload(id)) this.uploads.retryUpload(id);
    else this.downloads.retryDownload(id);
  }
  cancel(id: string): void {
    if (this.isUpload(id)) this.uploads.cancelUpload(id);
    else this.downloads.cancelDownload(id);
  }
  remove(id: string): void {
    if (this.isUpload(id)) this.uploads.removeUpload(id);
    else this.downloads.removeDownload(id);
  }

  /** Cancel every in-flight upload and download. */
  cancelAll(): void {
    this.uploads.cancelAll();
    this.downloads.cancelAll();
  }

  /** Open a file in a new browser tab. */
  open(url: string): void {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
  }

  private isUpload(id: string): boolean {
    return this.uploads.tasks().some((t) => t.id === id);
  }
}
