# Pixel File Transfer Framework

A UI-independent, signal-driven, adapter-based file **upload + download** engine for the
`pixel-ui` library. Works from pages, components, services, effects, NgRx,
signal stores, and micro-frontends. No template or DOM coupling — the
`pixel-file-upload` component can delegate its transfers here.

> **Docs IA:** registered under the **Services** category (`pixel-file-transfer`) — headless,
> not a `pixel-*` UI folder (CONVENTIONS §3e).

> **Not for tabular export.** To turn in-memory rows into CSV / JSON / Excel and save locally,
> use **`PixelExportService`** (`services/export`). File Transfer owns network queues; Export owns
> serialize + `saveAs`. The shared `saveAs` helper is what `saveBlob()` delegates to.

## Architecture

```
PixelFileTransferService        ← facade (most consumers use this)
├── PixelUploadService          ← upload queue, retry, pause/resume/cancel, signals
├── PixelDownloadService        ← download queue, blob/saveAs/zip, signals
│                                  (`saveBlob` → shared export `saveAs`)
└── PixelFileTransferStore      ← read-only aggregate signal view

Adapters (storage-agnostic transfer)
├── PixelUploadAdapter   ⟶ PixelRestAdapter (default, HttpClient)
└── PixelDownloadAdapter ⟶ PixelRestAdapter (default, HttpClient)

DI tokens
├── PIXEL_FILE_TRANSFER_CONFIG  ← global config
├── PIXEL_UPLOAD_ADAPTER        ← swap upload backend (S3, Azure, …)
└── PIXEL_DOWNLOAD_ADAPTER      ← swap download backend
```

Everything is **signals** for state (OnPush-safe) and **RxJS Subjects** for events.

## Setup

```ts
// app.config.ts
import { provideHttpClient } from '@angular/common/http';
import { PIXEL_FILE_TRANSFER_CONFIG } from 'pixel-ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    {
      provide: PIXEL_FILE_TRANSFER_CONFIG,
      useValue: {
        uploadUrl: '/api/files/upload',
        maxFileSize: 25 * 1024 * 1024,
        acceptedTypes: 'image/*,.pdf',
        parallelUploads: 3,
        autoRetry: true,
        retryCount: 3,
        retryDelay: 500,
      },
    },
  ],
};
```

## Upload

```ts
import { PixelFileTransferService } from 'pixel-ui';

private readonly transfer = inject(PixelFileTransferService);

// Single
const id = this.transfer.upload(file, { url: '/api/avatar' });

// Many
this.transfer.uploadMany(files);

// Controls (work on upload or download ids)
this.transfer.pause(id);
this.transfer.resume(id);
this.transfer.retry(id);
this.transfer.cancel(id);
this.transfer.remove(id);
this.transfer.cancelAll();
```

## Download

```ts
// Single (saves via browser "Save As")
this.transfer.download('/api/reports/42.pdf', { fileName: 'Q4-report.pdf' });

// Bulk
this.transfer.downloadMany(['/a.pdf', '/b.pdf']);

// Blob only (no save) — for in-app preview
const blob = await this.transfer.downloadBlob('/api/policy.pdf');

// ZIP (bring your own zipper, e.g. JSZip — keeps the library dependency-free)
await this.transfer.downloadZip(files, 'attachments.zip', async (entries) => {
  const zip = new JSZip();
  entries.forEach((e) => zip.file(e.name, e.blob));
  return zip.generateAsync({ type: 'blob' });
});

// Open in a new tab
this.transfer.open('/api/files/preview/42');
```

## Reactive state (signals)

```ts
private readonly store = inject(PixelFileTransferStore);

readonly uploads          = this.store.uploads;            // Signal<UploadTask[]>
readonly downloads        = this.store.downloads;
readonly activeTransfers  = this.store.activeTransfers;    // Signal<number>
readonly failed           = this.store.failedTransfers;
readonly totalProgress    = this.store.totalProgress;      // Signal<number> 0–100
readonly isBusy           = this.store.isBusy;             // Signal<boolean>
```

## Events (RxJS)

```ts
private readonly up = inject(PixelUploadService);

this.up.uploadStarted$.subscribe((task) => audit('upload:start', task.id));
this.up.uploadProgress$.subscribe((task) => console.log(task.progress));
this.up.uploadCompleted$.subscribe((task) => toast(`Uploaded ${task.file.name}`));
this.up.uploadFailed$.subscribe((task) => toast.error(task.error?.message));
```

## Custom adapters (cloud providers)

Implement `PixelUploadAdapter` / `PixelDownloadAdapter` and register via DI — the
queue, retry, progress, and cancellation logic is reused unchanged.

```ts
@Injectable({ providedIn: 'root' })
export class S3PresignedAdapter implements PixelUploadAdapter {
  upload(file, options): Observable<PixelUploadProgress> { /* PUT to presigned URL */ }
}

// providers:
{ provide: PIXEL_UPLOAD_ADAPTER, useExisting: S3PresignedAdapter }
```

## Validation

Configured globally (`maxFileSize`, `acceptedTypes`, `maxFiles`, `maxDownloadSize`) or
via custom validators:

```ts
inject(PixelUploadService).setValidators([
  (file) => file.name.includes(' ') ? 'Filenames cannot contain spaces' : null,
]);
```

## Error handling

Errors are normalised to `PixelTransferError` with a `kind`:
`network | timeout | permission | not-found | validation | aborted | server | unknown`.

## Cancellation

Cancel/pause unsubscribes the underlying HttpClient request (which aborts the XHR).
Adapters must clean up on unsubscribe — the built-in `PixelRestAdapter` does.

## Chunked & resumable upload

Enable `chunkUpload` in config. Files larger than `chunkSize` are sliced and uploaded
chunk-by-chunk via the adapter's `uploadChunk` (the REST adapter sends `X-Chunk-Index`,
`X-Total-Chunks`, `X-File-Id`, and `Content-Range` headers). **Pause keeps the chunk
cursor** so `resume()` continues mid-file; `cancel()` resets it so a retry restarts.

```ts
{ provide: PIXEL_FILE_TRANSFER_CONFIG, useValue: { chunkUpload: true, chunkSize: 5 * 1024 * 1024 } }
```

## Ranged parallel download

Enable `chunkDownload`. Files with a known `size` larger than `chunkSize` are split into
HTTP `Range` requests downloaded with `parallelDownloads` concurrency, then assembled
in order into a single Blob and saved. A failed range fails the task (retry re-drives it).

```ts
transfer.download({ id: '1', url: '/api/big.iso', fileName: 'big.iso', size: 5_000_000_000 });
```

## True streaming download

For very large files, `downloadStream()` uses `fetch` + `ReadableStream` and — when the
**File System Access API** is available — writes chunks straight to disk via a
`WritableStream` for near-constant memory. Falls back to a Blob + saveAs otherwise.

```ts
await transfer.downloadStream('/api/archive-10gb.zip', { fileName: 'archive.zip' });
```

## Offline queue

`PixelOfflineQueueService` holds transfers while offline and replays them on reconnect.
Downloads (URL-based) persist to `localStorage` and survive a reload; uploads (live
`File`) are queued in memory for the session.

```ts
private readonly offline = inject(PixelOfflineQueueService);

offline.upload(file, { url: '/api/upload' });  // runs now if online, else queued
offline.download('/api/report.pdf');           // persisted if offline, replayed online

offline.online();        // Signal<boolean>
offline.pendingCount();  // Signal<number>
```

## Behavior notes

- Facade `PixelFileTransferService` queues uploads/downloads with pause/resume/retry/cancel; state is signals, lifecycle is RxJS Subjects.
- Configure once via `PIXEL_FILE_TRANSFER_CONFIG` (URLs, concurrency, retry, chunking); swap backends with upload/download adapters.
- `saveBlob` delegates to the shared export `saveAs`; ZIP requires a consumer-provided zipper.
- Offline queue, chunked/resumable upload, and ranged parallel download are opt-in capabilities documented above — not a tabular export path.

## Accessibility

- No DOM — accessibility is owned by presenting components (`pixel-file-upload`, progress bars, control buttons).
- Pair progress with `aria-live` regions and give transfer-control buttons descriptive labels in your UI.

## Theme customization

- No UI tokens — nothing to theme. Compose with `pixel-progress-bar`, `pixel-button`, and `pixel-file-upload` for presentation.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Service `PixelDownloadService`

Manages the download queue: concurrency-limited processing, progress, retry, pause / resume / cancel, plus blob, bulk, and ZIP helpers — all signal-driven.

| Method | Signature | Description |
| --- | --- | --- |
| `download` | `download(source: string | PixelDownloadFile, options: PixelDownloadOptions = {}): string` | Queue a download from a URL (or a full PixelDownloadFile). Returns the task id. |
| `downloadMany` | `downloadMany(sources: readonly (string | PixelDownloadFile)[], options: PixelDownloadOptions = {}): string[]` | Queue multiple downloads. Returns all task ids. |
| `downloadBlob` | `downloadBlob(source: string | PixelDownloadFile, options: PixelDownloadOptions = {}): Promise<Blob>` | Download a single resource and return its Blob without saving to disk. Useful for in-app PDF/CSV/image preview. |
| `downloadZip` | `downloadZip(sources: readonly (string | PixelDownloadFile)[], zipFileName: string, zipper: (entries: { name: string; blob: Blob }[]) => Promise<Blob>, options: PixelDownloadOptions = {}): Promise<void>` | Fetch multiple files and bundle them into a single ZIP, then save it. Requires a `zipper` fn (e.g. backed by JSZip) so the library stays dependency-free: ```ts downloadService.downloadZip(files, 'attachments.zip', async (entries) => { const zip = new JSZip(); entries.forEach(e => zip.file(e.name, e.blob)); return zip.generateAsync({ type: 'blob' }); }); ``` |
| `pauseDownload` | `pauseDownload(id: string): void` |  |
| `resumeDownload` | `resumeDownload(id: string, options: PixelDownloadOptions = {}): void` |  |
| `retryDownload` | `retryDownload(id: string, options: PixelDownloadOptions = {}): void` |  |
| `cancelDownload` | `cancelDownload(id: string): void` |  |
| `cancelAll` | `cancelAll(): void` |  |
| `removeDownload` | `removeDownload(id: string): void` |  |
| `clearCompleted` | `clearCompleted(): void` |  |
| `downloadStream` | `downloadStream(source: string | PixelDownloadFile, options: PixelDownloadOptions = {}): Promise<string>` | Streams a download without buffering the whole response through a growing XHR. When the File System Access API is available (and not suppressed), writes chunks straight to disk via a WritableStream for near-constant memory — suitable for very large files (500 MB – 10 GB+). Otherwise falls back to a Blob + saveAs. Returns the created task id. Cancellable via `cancelDownload(id)`. |

### Service `PixelFileTransferService`

Facade over the upload and download services + aggregate store. This is the single entry point most consumers need — inject it from pages, components, services, effects, NgRx, signal stores, or micro-frontends. For finer control, inject `PixelUploadService` / `PixelDownloadService` directly. UI-independent — no template or DOM dependencies. The pixel-file-upload component can delegate its transfers here.

| Method | Signature | Description |
| --- | --- | --- |
| `upload` | `upload(file: File, options?: PixelUploadOptions): string` |  |
| `uploadMany` | `uploadMany(files: readonly File[], options?: PixelUploadOptions): string[]` |  |
| `download` | `download(source: string | PixelDownloadFile, options?: PixelDownloadOptions): string` |  |
| `downloadMany` | `downloadMany(sources: readonly (string | PixelDownloadFile)[], options?: PixelDownloadOptions): string[]` |  |
| `downloadBlob` | `downloadBlob(source: string | PixelDownloadFile, options?: PixelDownloadOptions): Promise<Blob>` |  |
| `downloadStream` | `downloadStream(source: string | PixelDownloadFile, options?: PixelDownloadOptions): Promise<string>` | Memory-aware streaming download for very large files (fetch + ReadableStream). |
| `downloadZip` | `downloadZip(sources: readonly (string | PixelDownloadFile)[], zipFileName: string, zipper: (entries: { name: string; blob: Blob }[]) => Promise<Blob>, options?: PixelDownloadOptions): Promise<void>` |  |
| `pause` | `pause(id: string): void` |  |
| `resume` | `resume(id: string): void` |  |
| `retry` | `retry(id: string): void` |  |
| `cancel` | `cancel(id: string): void` |  |
| `remove` | `remove(id: string): void` |  |
| `cancelAll` | `cancelAll(): void` | Cancel every in-flight upload and download. |
| `open` | `open(url: string): void` | Open a file in a new browser tab. |

### Service `PixelOfflineQueueService`

Opt-in offline queue. When the browser is offline, transfers are held and replayed automatically on reconnect (`window 'online'`). - **Downloads** are URL-based and serialisable, so they persist to `localStorage` and survive a full page reload. - **Uploads** carry a live `File` (not serialisable), so they're queued in memory and replayed within the same session only. Usage — route transfers through this service instead of calling upload/download directly when you want offline resilience: ```ts offline.upload(file, { url: '/api/upload' }); // runs now if online, else queued offline.download('/api/report.pdf'); // persisted if offline ```

| Method | Signature | Description |
| --- | --- | --- |
| `upload` | `upload(file: File, options: PixelUploadOptions = {}): string` | Upload now when online; otherwise hold in memory and replay on reconnect. |
| `download` | `download(url: string, options: PixelDownloadOptions = {}): string` | Download now when online; otherwise persist (survives reload) and replay later. |
| `flush` | `flush(): void` | Manually replay all queued transfers (also runs automatically on reconnect). |
| `clear` | `clear(): void` | Drop all queued intents without replaying. |
| `dispose` | `dispose(): void` | Detach window listeners (call from a host component's ngOnDestroy if needed). |

### Service `PixelUploadService`

Manages the upload queue: validation, concurrency-limited processing, progress, retry (exponential backoff), and pause / resume / cancel — all signal-driven. Adapter-agnostic: the actual transfer is delegated to a `PixelUploadAdapter` (default `PixelRestAdapter`, override via `PIXEL_UPLOAD_ADAPTER`).

| Method | Signature | Description |
| --- | --- | --- |
| `setValidators` | `setValidators(validators: PixelUploadValidator[]): void` |  |
| `upload` | `upload(file: File, options: PixelUploadOptions = {}): string` | Queue a single file. Returns the created task id. |
| `uploadMany` | `uploadMany(files: readonly File[], options: PixelUploadOptions = {}): string[]` | Queue many files at once. Returns all created task ids. |
| `pauseUpload` | `pauseUpload(id: string): void` |  |
| `resumeUpload` | `resumeUpload(id: string, options: PixelUploadOptions = {}): void` |  |
| `retryUpload` | `retryUpload(id: string, options: PixelUploadOptions = {}): void` |  |
| `cancelUpload` | `cancelUpload(id: string): void` |  |
| `cancelAll` | `cancelAll(): void` |  |
| `removeUpload` | `removeUpload(id: string): void` |  |
| `clearCompleted` | `clearCompleted(): void` |  |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelTransferStatus` | `| 'pending' // created, not yet queued | 'queued' // waiting for a free slot | 'validating' // running validators | 'uploading' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled'` |
| `PixelTransferErrorKind` | `| 'network' | 'timeout' | 'permission' | 'not-found' | 'validation' | 'aborted' | 'server' | 'unknown'` |
| `ResolvedFileTransferConfig` | `Required< Pick< PixelFileTransferConfig, | 'retryCount' | 'retryDelay' | 'autoRetry' | 'parallelUploads' | 'parallelDownloads' | 'parallelChunks' | 'chunkSize' > > & PixelFileTransferConfig` |
| `PixelUploadValidator` | `(file: File) => string | null` |
| `PixelDownloadValidator` | `(file: PixelDownloadFile) => string | null` |

### Exported interfaces

**`PixelTransferError`**

```ts
interface PixelTransferError {
  readonly kind: PixelTransferErrorKind;
  readonly message: string;
  readonly cause?: unknown;
  readonly status?: number;
}
```

**`PixelUploadFile`**

```ts
interface PixelUploadFile {
  readonly id: string;
  readonly file: File;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly metadata?: Record<string, unknown>;
}
```

**`PixelDownloadFile`**

```ts
interface PixelDownloadFile {
  readonly id: string;
  readonly fileName: string;
  readonly url: string;
  readonly size?: number;
  readonly type?: string;
  readonly metadata?: Record<string, unknown>;
}
```

**`PixelUploadResponse`** — Server response surfaced on a completed upload task.

```ts
interface PixelUploadResponse {
  readonly fileId?: string;
  readonly url?: string;
  readonly [key: string]: unknown;
}
```

**`PixelUploadTask`**

```ts
interface PixelUploadTask {
  readonly id: string;
  readonly file: PixelUploadFile;
  readonly progress: number;
  readonly status: PixelTransferStatus;
  readonly response?: PixelUploadResponse;
  readonly error?: PixelTransferError;
  readonly attempts: number;
  readonly priority: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}
```

**`PixelDownloadTask`**

```ts
interface PixelDownloadTask {
  readonly id: string;
  readonly file: PixelDownloadFile;
  readonly progress: number;
  readonly status: PixelTransferStatus;
  readonly blob?: Blob;
  readonly error?: PixelTransferError;
  readonly attempts: number;
  readonly priority: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}
```

**`PixelFileTransferConfig`**

```ts
interface PixelFileTransferConfig {
  uploadUrl?: string;
  downloadUrl?: string;
  maxFileSize?: number;
  maxFiles?: number;
  acceptedTypes?: string;
  maxDownloadSize?: number;
  chunkUpload?: boolean;
  chunkDownload?: boolean;
  chunkSize?: number;
  retryCount?: number;
  retryDelay?: number;
  autoRetry?: boolean;
  timeout?: number;
  parallelUploads?: number;
  parallelDownloads?: number;
  parallelChunks?: number;
  withCredentials?: boolean;
  headers?: Record<string, string>;
}
```

**`PixelUploadOptions`**

```ts
interface PixelUploadOptions {
  url?: string;
  fieldName?: string;
  metadata?: Record<string, unknown>;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  priority?: number;
}
```

**`PixelDownloadOptions`**

```ts
interface PixelDownloadOptions {
  fileName?: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  noSave?: boolean;
  priority?: number;
}
```

<!-- API-CONTRACT:END -->
