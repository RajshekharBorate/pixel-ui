// ─── Pixel File Transfer Framework — types ──────────────────────────────────────
// UI-independent type contracts shared across the upload / download services, the
// signal store, and adapter implementations.

/** Lifecycle status shared by upload and download tasks. */
export type PixelTransferStatus =
  | 'pending'      // created, not yet queued
  | 'queued'       // waiting for a free slot
  | 'validating'   // running validators
  | 'uploading'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** Categorised error so consumers can branch without string matching. */
export type PixelTransferErrorKind =
  | 'network'
  | 'timeout'
  | 'permission'
  | 'not-found'
  | 'validation'
  | 'aborted'
  | 'server'
  | 'unknown';

export interface PixelTransferError {
  readonly kind: PixelTransferErrorKind;
  readonly message: string;
  /** Original error (HttpErrorResponse, DOMException, etc.) for debugging. */
  readonly cause?: unknown;
  readonly status?: number;
}

// ── File models ─────────────────────────────────────────────────────────────────

export interface PixelUploadFile {
  readonly id: string;
  readonly file: File;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly metadata?: Record<string, unknown>;
}

export interface PixelDownloadFile {
  readonly id: string;
  readonly fileName: string;
  readonly url: string;
  readonly size?: number;
  readonly type?: string;
  readonly metadata?: Record<string, unknown>;
}

/** Server response surfaced on a completed upload task. */
export interface PixelUploadResponse {
  readonly fileId?: string;
  readonly url?: string;
  readonly [key: string]: unknown;
}

// ── Task models ──────────────────────────────────────────────────────────────────

export interface PixelUploadTask {
  readonly id: string;
  readonly file: PixelUploadFile;
  /** 0–100. */
  readonly progress: number;
  readonly status: PixelTransferStatus;
  readonly response?: PixelUploadResponse;
  readonly error?: PixelTransferError;
  /** Number of retry attempts already made. */
  readonly attempts: number;
  /** Dequeue priority — higher runs first. Default 0. */
  readonly priority: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface PixelDownloadTask {
  readonly id: string;
  readonly file: PixelDownloadFile;
  readonly progress: number;
  readonly status: PixelTransferStatus;
  readonly blob?: Blob;
  readonly error?: PixelTransferError;
  readonly attempts: number;
  /** Dequeue priority — higher runs first. Default 0. */
  readonly priority: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

// ── Configuration ─────────────────────────────────────────────────────────────────

export interface PixelFileTransferConfig {
  uploadUrl?: string;
  downloadUrl?: string;

  // Validation
  maxFileSize?: number;          // bytes, per file
  maxFiles?: number;
  acceptedTypes?: string;        // same syntax as <input accept>
  maxDownloadSize?: number;      // bytes

  // Chunking (consumed by chunk-capable adapters)
  chunkUpload?: boolean;
  chunkDownload?: boolean;
  chunkSize?: number;            // bytes, default 5 MiB

  // Retry
  retryCount?: number;           // default 3
  retryDelay?: number;           // base ms for exponential backoff, default 500
  autoRetry?: boolean;           // default false

  // Idle timeout — fail a transfer if no progress arrives within this many ms. 0 = disabled.
  timeout?: number;              // default 0

  // Concurrency
  parallelUploads?: number;      // default 3
  parallelDownloads?: number;    // default 3
  parallelChunks?: number;       // concurrent chunk requests within one chunked file, default 3

  // Networking
  withCredentials?: boolean;
  headers?: Record<string, string>;
}

/** Fully-resolved config (defaults applied) used internally. */
export type ResolvedFileTransferConfig = Required<
  Pick<
    PixelFileTransferConfig,
    | 'retryCount'
    | 'retryDelay'
    | 'autoRetry'
    | 'parallelUploads'
    | 'parallelDownloads'
    | 'parallelChunks'
    | 'chunkSize'
  >
> &
  PixelFileTransferConfig;

export const PIXEL_FILE_TRANSFER_DEFAULTS: ResolvedFileTransferConfig = {
  retryCount: 3,
  retryDelay: 500,
  autoRetry: false,
  parallelUploads: 3,
  parallelDownloads: 3,
  parallelChunks: 3,
  chunkSize: 5 * 1024 * 1024,
};

// ── Request options ────────────────────────────────────────────────────────────────

export interface PixelUploadOptions {
  url?: string;
  fieldName?: string;            // multipart field name, default 'file'
  metadata?: Record<string, unknown>;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  /** Higher values are dequeued first. Default 0. */
  priority?: number;
}

export interface PixelDownloadOptions {
  /** Override the filename used by saveAs. */
  fileName?: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  /** Skip the automatic browser save (e.g. when you only want the Blob). */
  noSave?: boolean;
  /** Higher values are dequeued first. Default 0. */
  priority?: number;
}

// ── Validation ──────────────────────────────────────────────────────────────────────

/** Returns null when valid, or an error message string when invalid. */
export type PixelUploadValidator = (file: File) => string | null;
export type PixelDownloadValidator = (file: PixelDownloadFile) => string | null;
