import { DocComponentMeta } from '../types';
import { FILE_TRANSFER_EXAMPLES } from '../../examples/pixel-file-transfer';

export const FILE_TRANSFER_META: DocComponentMeta = {
  id: 'pixel-file-transfer',
  title: 'File Transfer',
  selector: 'PixelFileTransferService',
  category: 'services',
  status: 'stable',
  summary:
    'UI-independent, signal-driven upload + download engine — queues, retry, pause/resume/cancel, chunked & resumable transfers, ranged parallel + streaming downloads, ZIP, and an offline queue. Adapter-based and cloud-agnostic.',
  overview: [
    'A service framework (not a UI component) usable from pages, components, services, effects, NgRx, signal stores, and micro-frontends. The pixel-file-upload component can delegate its transfers here.',
    'PixelFileTransferService is the facade; PixelUploadService and PixelDownloadService own their queues; PixelFileTransferStore exposes a read-only aggregate signal view.',
    'Storage-agnostic via the adapter pattern — the default PixelRestAdapter uses HttpClient; swap PIXEL_UPLOAD_ADAPTER / PIXEL_DOWNLOAD_ADAPTER for S3 presigned URLs, Azure Blob, or GCS without touching the queue/retry/progress logic.',
    'Chunked & resumable upload (config chunkUpload): pause keeps the chunk cursor so resume continues mid-file. Ranged parallel download (chunkDownload) splits known-size files into HTTP Range requests and preserves completed ranges across pause/resume. downloadStream() uses fetch + ReadableStream with File System Access API for memory-aware multi-GB downloads.',
    'Resilience: per-request idle timeout (config timeout — fails if no progress within the window) plus exponential-backoff auto-retry. Progress updates are allocation-light, so queues of thousands of files stay responsive.',
    'Throughput controls: bounded-parallel chunk uploads (config parallelChunks), concurrency-capped bulk/ZIP downloads (parallelDownloads), and a priority queue — pass options.priority (higher runs first) on upload/download.',
    'PixelOfflineQueueService holds transfers while offline and replays on reconnect — downloads persist to localStorage (survive reload), uploads queue in memory for the session.',
  ],
  useCases: [
    'Centralised upload/download engine shared across apps and micro-frontends',
    'Document / attachment / media management with progress and queues',
    'Large-file (multi-GB) streaming downloads and chunked resumable uploads',
    'Bulk operations — download selected, ZIP all attachments',
    'Pair with PixelExportService when you need rows → CSV/JSON/Excel (local serialize; not this queue)',
  ],
  themingNotes: [
    'No UI — nothing to theme. Compose with pixel-progress-bar, pixel-button, and pixel-file-upload for presentation.',
    'Configure once via PIXEL_FILE_TRANSFER_CONFIG (uploadUrl, retry, concurrency, chunking).',
    'All state is exposed as signals (OnPush-safe) and lifecycle events as RxJS Subjects.',
  ],
  accessibilityNotes: [
    'Service layer has no DOM; accessibility is owned by the presenting components.',
    'Pair progress with aria-live regions and give transfer-control buttons descriptive labels in your UI.',
  ],
  imports: ['PixelFileTransferService'],
  inputs: [],
  outputs: [],
  serviceName: 'PixelFileTransferService',
  serviceApi: [
    { name: 'upload', signature: 'upload(file: File, options?: PixelUploadOptions): string', description: 'Queue a single file upload. Returns the task id.' },
    { name: 'uploadMany', signature: 'uploadMany(files: File[], options?): string[]', description: 'Queue multiple uploads at once.' },
    { name: 'download', signature: 'download(source: string | PixelDownloadFile, options?): string', description: 'Queue a download (saves via browser Save As).' },
    { name: 'downloadMany', signature: 'downloadMany(sources, options?): string[]', description: 'Queue multiple downloads.' },
    { name: 'downloadBlob', signature: 'downloadBlob(source, options?): Promise<Blob>', description: 'Fetch a resource as a Blob without saving — for in-app preview.' },
    { name: 'downloadStream', signature: 'downloadStream(source, options?): Promise<string>', description: 'Memory-aware streaming download (fetch + ReadableStream) for very large files.' },
    { name: 'downloadZip', signature: 'downloadZip(sources, name, zipper, options?): Promise<void>', description: 'Fetch many files and bundle them into a ZIP (bring-your-own zipper fn).' },
    { name: 'pause / resume / retry / cancel / remove', signature: '(id: string): void', description: 'Unified controls that route to the upload or download queue by task id.' },
    { name: 'cancelAll', signature: 'cancelAll(): void', description: 'Cancel every in-flight upload and download.' },
    { name: 'open', signature: 'open(url: string): void', description: 'Open a file URL in a new browser tab.' },
    { name: 'store', signature: 'PixelFileTransferStore', description: 'Aggregate signals: uploads(), downloads(), activeTransfers(), failedTransfers(), totalProgress(), isBusy().' },
  ],
  examples: FILE_TRANSFER_EXAMPLES,
};
