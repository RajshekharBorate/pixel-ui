import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpEventType,
  HttpHeaders,
  HttpRequest,
} from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';
import type {
  PixelDownloadFile,
  PixelDownloadOptions,
  PixelUploadFile,
  PixelUploadOptions,
} from '../file-transfer.types';
import type { PixelUploadAdapter, PixelUploadProgress } from './upload-adapter.interface';
import type { PixelDownloadAdapter, PixelDownloadProgress } from './download-adapter.interface';

/**
 * Default REST adapter for both upload and download, built on Angular's HttpClient.
 *
 * - Upload uses `multipart/form-data` with `reportProgress` upload events.
 * - Download uses `responseType: 'blob'` with `reportProgress` download events.
 * - Cancellation works automatically: HttpClient aborts the XHR when the subscription
 *   is torn down (which the service does on cancel/pause).
 *
 * Override via `PIXEL_UPLOAD_ADAPTER` / `PIXEL_DOWNLOAD_ADAPTER` for S3, Azure, etc.
 */
@Injectable({ providedIn: 'root' })
export class PixelRestAdapter implements PixelUploadAdapter, PixelDownloadAdapter {
  private readonly http = inject(HttpClient);

  upload(file: PixelUploadFile, options: PixelUploadOptions): Observable<PixelUploadProgress> {
    const url = options.url;
    if (!url) {
      return new Observable((s) => s.error(new Error('No upload URL configured (set uploadUrl or pass options.url).')));
    }

    const form = new FormData();
    form.append(options.fieldName ?? 'file', file.file, file.name);
    if (options.metadata) {
      form.append('metadata', JSON.stringify(options.metadata));
    }

    const req = new HttpRequest('POST', url, form, {
      reportProgress: true,
      withCredentials: options.withCredentials ?? false,
      headers: options.headers ? new HttpHeaders(options.headers) : undefined,
    });

    return this.http.request(req).pipe(
      map((event): PixelUploadProgress | null => {
        switch (event.type) {
          case HttpEventType.UploadProgress: {
            const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
            return { progress, done: false };
          }
          case HttpEventType.Response:
            return { progress: 100, done: true, response: (event.body as Record<string, unknown>) ?? {} };
          default:
            return null;
        }
      }),
      filter((e): e is PixelUploadProgress => e !== null),
    );
  }

  /**
   * Uploads a single chunk. Sends the slice as multipart with coordination headers the
   * backend uses to reassemble and to support resume:
   *   X-File-Id, X-File-Name, X-Chunk-Index, X-Total-Chunks, Content-Range.
   * The terminal (last) chunk's response body is surfaced as the upload response.
   */
  uploadChunk(
    file: PixelUploadFile,
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    options: PixelUploadOptions,
  ): Observable<PixelUploadProgress> {
    const url = options.url;
    if (!url) {
      return new Observable((s) => s.error(new Error('No upload URL configured for chunk upload.')));
    }
    const start = chunkIndex * chunk.size;
    const headers = new HttpHeaders({
      ...(options.headers ?? {}),
      'X-File-Id': file.id,
      'X-File-Name': file.name,
      'X-Chunk-Index': String(chunkIndex),
      'X-Total-Chunks': String(totalChunks),
      // Content-Range total is the full file size when known.
      'Content-Range': `bytes ${start}-${start + chunk.size - 1}/${file.size}`,
    });
    const form = new FormData();
    form.append(options.fieldName ?? 'file', chunk, file.name);

    const req = new HttpRequest('POST', url, form, {
      reportProgress: true,
      withCredentials: options.withCredentials ?? false,
      headers,
    });

    return this.http.request(req).pipe(
      map((event): PixelUploadProgress | null => {
        switch (event.type) {
          case HttpEventType.UploadProgress: {
            const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
            return { progress, done: false };
          }
          case HttpEventType.Response:
            return { progress: 100, done: true, response: (event.body as Record<string, unknown>) ?? {} };
          default:
            return null;
        }
      }),
      filter((e): e is PixelUploadProgress => e !== null),
    );
  }

  download(file: PixelDownloadFile, options: PixelDownloadOptions): Observable<PixelDownloadProgress> {
    const req = new HttpRequest('GET', file.url, {
      reportProgress: true,
      responseType: 'blob',
      withCredentials: options.withCredentials ?? false,
      headers: options.headers ? new HttpHeaders(options.headers) : undefined,
    });

    return this.http.request<Blob>(req).pipe(
      map((event): PixelDownloadProgress | null => {
        switch (event.type) {
          case HttpEventType.DownloadProgress: {
            const progress = event.total ? Math.round((event.loaded / event.total) * 100) : -1;
            return { progress, done: false };
          }
          case HttpEventType.Response:
            return { progress: 100, done: true, blob: event.body ?? new Blob() };
          default:
            return null;
        }
      }),
      filter((e): e is PixelDownloadProgress => e !== null),
    );
  }

  /** Ranged download for chunked/parallel transfers (HTTP Range header). */
  downloadChunk(
    file: PixelDownloadFile,
    start: number,
    end: number,
    options: PixelDownloadOptions,
  ): Observable<PixelDownloadProgress> {
    const headers = new HttpHeaders({
      ...(options.headers ?? {}),
      Range: `bytes=${start}-${end}`,
    });
    const req = new HttpRequest('GET', file.url, {
      reportProgress: true,
      responseType: 'blob',
      withCredentials: options.withCredentials ?? false,
      headers,
    });
    return this.http.request<Blob>(req).pipe(
      map((event): PixelDownloadProgress | null => {
        if (event.type === HttpEventType.Response) {
          return { progress: 100, done: true, blob: event.body ?? new Blob() };
        }
        return null;
      }),
      filter((e): e is PixelDownloadProgress => e !== null),
    );
  }
}
