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
