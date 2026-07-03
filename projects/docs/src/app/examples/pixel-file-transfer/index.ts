import { createDocExample } from '../../shared/example-source.util';
import { FileTransferUploadExample } from './file-transfer-upload.example';
import { FileTransferDownloadExample } from './file-transfer-download.example';
import { FileTransferOfflineExample } from './file-transfer-offline.example';
import { FileTransferPriorityExample } from './file-transfer-priority.example';
import { FileTransferRetryExample } from './file-transfer-retry.example';
import { FileTransferZipExample } from './file-transfer-zip.example';
import { FileTransferStreamingExample } from './file-transfer-streaming.example';

export const FILE_TRANSFER_EXAMPLES = [
  createDocExample({
    id: 'upload-queue',
    title: 'Upload queue & controls',
    category: 'Upload',
    description:
      'pixel-file-upload picks the files; PixelUploadService owns the queue — parallel uploads, per-task progress, and pause / resume / retry / cancel / remove. A simulated adapter runs it without a backend.',
    component: FileTransferUploadExample,
    imports: ['PixelUploadService', 'PixelFileUploadComponent'],
    html: `<pixel-file-upload
  variant="button"
  buttonLabel="Add files to queue"
  [multiple]="true"
  (filesChange)="onFiles($event)"
/>

@for (task of upload.tasks(); track task.id) {
  <pixel-progress-bar [value]="task.progress" size="sm" />
  <!-- pause / resume / retry / cancel / remove buttons per task.status -->
}`,
    typescript: `import { Component, inject } from '@angular/core';
import {
  PIXEL_UPLOAD_ADAPTER,
  PixelUploadService,
  type PixelFileSelectEvent,
} from 'pixel-ui';
import { DemoUploadAdapter } from './demo-upload-adapter';

@Component({
  // Provide the service here so it resolves THIS injector's adapter.
  // In a real app, configure PIXEL_FILE_TRANSFER_CONFIG with uploadUrl and use the
  // default REST adapter — no provider override needed.
  providers: [
    DemoUploadAdapter,
    { provide: PIXEL_UPLOAD_ADAPTER, useExisting: DemoUploadAdapter },
    PixelUploadService,
  ],
  /* … */
})
export class FileTransferUploadExample {
  protected readonly upload = inject(PixelUploadService);

  onFiles(event: PixelFileSelectEvent): void {
    this.upload.uploadMany(event.accepted.map((f) => f.file));
  }
}`,
    scss: `.queue { display: flex; flex-direction: column; gap: 0.5rem; }`,
  }),

  createDocExample({
    id: 'download-export',
    title: 'Download & export',
    category: 'Download',
    description:
      'Generate files in the browser and run them through the download queue (progress + saveAs). downloadBlob() returns a Blob without saving — ideal for in-app preview of PDF / CSV / images.',
    component: FileTransferDownloadExample,
    imports: ['PixelDownloadService'],
    html: `<pixel-button (click)="downloadCsv()">Export CSV</pixel-button>
<pixel-button (click)="downloadJson()">Export JSON</pixel-button>
<pixel-button (click)="downloadBlobPreview()">Get Blob (no save)</pixel-button>`,
    typescript: `private readonly downloads = inject(PixelDownloadService);

downloadCsv(): void {
  const csv = 'id,name\\n1,Policy A\\n2,Policy B';
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  this.downloads.download(url, { fileName: 'policies.csv' });   // queue → progress → saveAs
}

async preview(): Promise<void> {
  const blob = await this.downloads.downloadBlob('/api/policy.pdf'); // no save
  // …render in an iframe / pdf viewer
}

// Bulk + ZIP (bring your own zipper, e.g. JSZip):
// this.downloads.downloadZip(files, 'attachments.zip', async (entries) => {
//   const zip = new JSZip();
//   entries.forEach((e) => zip.file(e.name, e.blob));
//   return zip.generateAsync({ type: 'blob' });
// });

// Streaming a very large file (memory-aware, writes to disk when supported):
// this.downloads.downloadStream('/api/archive-10gb.zip', { fileName: 'archive.zip' });`,
    scss: `.grid { display: flex; flex-wrap: wrap; gap: 0.75rem; }`,
  }),

  createDocExample({
    id: 'offline-queue',
    title: 'Offline queue & replay',
    category: 'Advanced',
    description:
      'PixelOfflineQueueService holds transfers while offline and replays them on reconnect. Downloads (URL-based) persist to localStorage and survive a reload; uploads queue in memory for the session. Toggle the connection to see queued uploads replay automatically.',
    component: FileTransferOfflineExample,
    imports: ['PixelOfflineQueueService'],
    html: `<pixel-chip [label]="offline.online() ? 'Online' : 'Offline'" />
<span>Queued: {{ offline.pendingCount() }}</span>
<pixel-button (click)="queueUpload()">Queue an upload</pixel-button>`,
    typescript: `private readonly offline = inject(PixelOfflineQueueService);

queueUpload(): void {
  const file = new File(['…'], 'evidence.txt', { type: 'text/plain' });
  // Runs now when online; held and replayed automatically on reconnect when offline.
  this.offline.upload(file, { url: '/api/upload' });
}

// Signals: offline.online()  ·  offline.pendingCount()
// Downloads persist across reload: offline.download('/api/report.pdf');`,
    scss: `.actions { display: flex; gap: 0.75rem; }`,
  }),

  createDocExample({
    id: 'priority',
    title: 'Priority queue',
    category: 'Upload',
    description:
      'Pass options.priority (higher runs first) to jump the queue. With parallelUploads: 1 the dequeue order is clearly visible — urgent items overtake pending ones.',
    component: FileTransferPriorityExample,
    imports: ['PixelUploadService'],
    html: `<pixel-button (click)="add(0)">Add normal (p0)</pixel-button>
<pixel-button (click)="add(10)">Add urgent (p10)</pixel-button>`,
    typescript: `add(priority: number): void {
  this.upload.upload(file, { priority });   // higher priority is dequeued first
}`,
    scss: `.queue { display: flex; flex-direction: column; gap: 0.35rem; }`,
  }),

  createDocExample({
    id: 'retry',
    title: 'Auto-retry with backoff',
    category: 'Advanced',
    description:
      'With autoRetry + retryCount + retryDelay, failed transfers retry automatically using exponential backoff. The simulated adapter fails the first two attempts of each file, then succeeds on the third.',
    component: FileTransferRetryExample,
    imports: ['PixelUploadService'],
    html: `<pixel-button (click)="add()">Upload a flaky file</pixel-button>
<!-- task.attempts and task.status update live -->`,
    typescript: `// Config (provide PIXEL_FILE_TRANSFER_CONFIG):
{ autoRetry: true, retryCount: 3, retryDelay: 300 }
// → retries at 300ms, 600ms, 1200ms (exponential backoff).`,
    scss: `.list { display: flex; flex-direction: column; gap: 0.35rem; }`,
  }),

  createDocExample({
    id: 'zip',
    title: 'ZIP download',
    category: 'Download',
    description:
      'downloadZip() fetches multiple files (capped at parallelDownloads) and bundles them with a zipper you supply — JSZip, fflate, or the tiny store-only writer used here. Keeps the library dependency-free.',
    component: FileTransferZipExample,
    imports: ['PixelDownloadService'],
    html: `<pixel-button (click)="zip()">Download attachments.zip</pixel-button>`,
    typescript: `await this.downloads.downloadZip(sources, 'attachments.zip', async (entries) => {
  // entries: { name, blob }[] — use any zipper:
  const zip = new JSZip();
  entries.forEach((e) => zip.file(e.name, e.blob));
  return zip.generateAsync({ type: 'blob' });
});`,
    scss: `/* No styles required */`,
  }),

  createDocExample({
    id: 'streaming',
    title: 'Streaming download',
    category: 'Download',
    description:
      'downloadStream() reads via fetch + ReadableStream for memory-aware transfer of very large files; when the File System Access API is available it writes straight to disk. This demo streams a generated 8 MB blob and shows live progress.',
    component: FileTransferStreamingExample,
    imports: ['PixelDownloadService'],
    html: `<pixel-button (click)="stream()">Stream large file</pixel-button>`,
    typescript: `const id = await this.downloads.downloadStream('/api/archive-10gb.zip', {
  fileName: 'archive.zip',
});
// Reactively read progress from downloads.tasks().find(t => t.id === id)`,
    scss: `.bar { block-size: 4px; }`,
  }),
] as const;
