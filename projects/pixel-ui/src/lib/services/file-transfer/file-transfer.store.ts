import { Injectable, computed, inject } from '@angular/core';
import { PixelUploadService } from './upload.service';
import { PixelDownloadService } from './download.service';
import type { PixelUploadTask, PixelDownloadTask } from './file-transfer.types';

/**
 * Read-only aggregate view over the upload and download services. Inject this in
 * components / signal stores / NgRx selectors when you only need observable state
 * and don't want to trigger transfers.
 *
 * All members are signals → fully OnPush-compatible.
 */
@Injectable({ providedIn: 'root' })
export class PixelFileTransferStore {
  private readonly uploadSvc = inject(PixelUploadService);
  private readonly downloadSvc = inject(PixelDownloadService);

  // ── Raw collections ───────────────────────────────────────────────────────────
  readonly uploads = this.uploadSvc.tasks;
  readonly downloads = this.downloadSvc.tasks;

  // ── Activity counters ──────────────────────────────────────────────────────────
  readonly activeUploads = this.uploadSvc.activeCount;
  readonly activeDownloads = this.downloadSvc.activeCount;
  readonly activeTransfers = computed(() => this.activeUploads() + this.activeDownloads());

  // ── Status partitions ────────────────────────────────────────────────────────────
  readonly completedUploads = this.uploadSvc.completed;
  readonly completedDownloads = this.downloadSvc.completed;
  readonly failedTransfers = computed<(PixelUploadTask | PixelDownloadTask)[]>(() => [
    ...this.uploadSvc.failed(),
    ...this.downloadSvc.failed(),
  ]);

  // ── Progress ──────────────────────────────────────────────────────────────────────
  readonly totalUploadProgress = this.uploadSvc.totalProgress;
  readonly totalDownloadProgress = this.downloadSvc.totalProgress;

  /** Combined progress across every upload and download task (0–100). */
  readonly totalProgress = computed(() => {
    const all = [...this.uploads(), ...this.downloads()];
    if (!all.length) return 0;
    return Math.round(all.reduce((sum, t) => sum + Math.max(0, t.progress), 0) / all.length);
  });

  readonly loading = computed(() => this.activeTransfers() > 0);

  /** True while any transfer is in flight — handy for global busy indicators. */
  readonly isBusy = this.loading;
}
