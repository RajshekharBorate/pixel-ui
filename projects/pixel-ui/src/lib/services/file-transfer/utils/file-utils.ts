import { HttpErrorResponse } from '@angular/common/http';
import { saveAs } from '../../export/save-as';
import type { PixelTransferError, PixelTransferErrorKind } from '../file-transfer.types';

let _seq = 0;

/** Collision-resistant id for tasks (crypto.randomUUID when available). */
export function pixelTransferId(prefix = 'pxt'): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${++_seq}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${uuid}`;
}

/** Human-readable byte size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

/**
 * Triggers a browser "Save As" for a Blob. Creates a transient object URL,
 * clicks a hidden anchor, then revokes the URL on the next tick.
 * Delegates to the shared export `saveAs` helper.
 */
export function saveBlob(blob: Blob, fileName: string): void {
  saveAs(blob, fileName);
}

/** Derive a filename from a URL when none is supplied. */
export function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url, 'http://_').pathname;
    const last = path.split('/').filter(Boolean).pop();
    return last ? decodeURIComponent(last) : 'download';
  } catch {
    return 'download';
  }
}

/** Normalises any thrown error into a categorised PixelTransferError. */
export function toTransferError(err: unknown): PixelTransferError {
  if (err instanceof HttpErrorResponse) {
    let kind: PixelTransferErrorKind = 'server';
    if (err.status === 0) kind = 'network';
    else if (err.status === 403) kind = 'permission';
    else if (err.status === 404) kind = 'not-found';
    else if (err.status === 408 || err.status === 504) kind = 'timeout';
    return { kind, message: err.message || `HTTP ${err.status}`, status: err.status, cause: err };
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return { kind: 'aborted', message: 'Transfer aborted', cause: err };
  }
  if (err instanceof Error) {
    const kind: PixelTransferErrorKind = /timeout/i.test(err.message) ? 'timeout' : 'unknown';
    return { kind, message: err.message, cause: err };
  }
  return { kind: 'unknown', message: String(err), cause: err };
}

/** Exponential backoff delay (ms) for a given attempt (0-based). */
export function backoffDelay(attempt: number, baseMs: number): number {
  return baseMs * 2 ** attempt;
}
