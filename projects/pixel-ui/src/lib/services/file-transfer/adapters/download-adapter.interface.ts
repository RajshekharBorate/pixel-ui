import { Observable } from 'rxjs';
import type { PixelDownloadFile, PixelDownloadOptions } from '../file-transfer.types';

/** A progress / completion event emitted by a download adapter. */
export interface PixelDownloadProgress {
  /** 0–100. -1 when total size is unknown (indeterminate). */
  readonly progress: number;
  /** Present only on the terminal event. */
  readonly blob?: Blob;
  readonly done: boolean;
}

/**
 * Storage-agnostic download contract. Implement this for REST, signed URLs, streaming
 * endpoints, or chunked range requests. The service layer handles queueing, retry,
 * progress, saveAs, and cancellation.
 *
 * Cancellation: the returned Observable MUST abort the underlying request on unsubscribe.
 */
export interface PixelDownloadAdapter {
  /** Download the resource as a Blob, reporting progress. */
  download(file: PixelDownloadFile, options: PixelDownloadOptions): Observable<PixelDownloadProgress>;

  /**
   * Optional ranged/chunked download (HTTP Range). When present and `chunkDownload` is
   * enabled, the service can parallelise and resume via byte ranges.
   */
  downloadChunk?(
    file: PixelDownloadFile,
    start: number,
    end: number,
    options: PixelDownloadOptions,
  ): Observable<PixelDownloadProgress>;
}
