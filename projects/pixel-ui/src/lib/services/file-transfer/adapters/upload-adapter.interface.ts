import { Observable } from 'rxjs';
import type {
  PixelUploadFile,
  PixelUploadOptions,
  PixelUploadResponse,
} from '../file-transfer.types';

/** A progress / completion event emitted by an upload adapter. */
export interface PixelUploadProgress {
  /** 0–100. */
  readonly progress: number;
  /** Present only on the terminal event. */
  readonly response?: PixelUploadResponse;
  readonly done: boolean;
}

/**
 * Storage-agnostic upload contract. Implement this to target REST, S3 presigned URLs,
 * Azure Blob, GCS, or any custom backend. The service layer handles queueing, retry,
 * progress aggregation, and cancellation — an adapter only performs the transfer.
 *
 * Cancellation: the returned Observable MUST clean up the underlying request when
 * unsubscribed (the service unsubscribes to cancel).
 */
export interface PixelUploadAdapter {
  /** Single-shot multipart/binary upload with progress events. */
  upload(file: PixelUploadFile, options: PixelUploadOptions): Observable<PixelUploadProgress>;

  /**
   * Optional chunked upload. When present and `chunkUpload` is enabled, the service
   * uses this instead of `upload`. `offset` lets the service resume from a byte position.
   */
  uploadChunk?(
    file: PixelUploadFile,
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    options: PixelUploadOptions,
  ): Observable<PixelUploadProgress>;
}
