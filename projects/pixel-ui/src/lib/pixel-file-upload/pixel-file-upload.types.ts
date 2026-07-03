export type PixelFileUploadVariant = 'dropzone' | 'button';
export type PixelFileUploadSize    = 'xs' | 'sm' | 'md' | 'lg';

/** Maps validation error keys to user-facing copy (same shape as pixel-input). */
export interface PixelFileUploadValidationMessages {
  required?: string;
  fileInvalid?: string;
  [errorCode: string]: string | undefined;
}

/** An accepted file enriched with a stable id and optional image preview. */
export interface PixelUploadedFile {
  /** Stable identifier (UUID v4). */
  readonly id: string;
  readonly file: File;
  /** `data:` URL for image files (generated via FileReader); null for other types. */
  readonly preview: string | null;
  /** Validation error set when the file fails accept / maxSize checks. */
  readonly error: string | null;
}

/** A file that was rejected during validation. */
export interface PixelFileRejection {
  readonly file: File;
  /** Human-readable reasons (type mismatch, file too large, too many files). */
  readonly errors: readonly string[];
}

/** Payload emitted by `(filesChange)`. */
export interface PixelFileSelectEvent {
  readonly accepted: readonly PixelUploadedFile[];
  readonly rejected: readonly PixelFileRejection[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

let _uid = 0;
export function generateFileId(): string {
  return `pxf-${Date.now()}-${++_uid}`;
}

/** Formats bytes to a human-readable size string. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)                   return `${bytes} B`;
  if (bytes < 1024 * 1024)            return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Returns a Material Symbols icon name for a MIME type. */
export function fileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/'))       return 'image';
  if (mimeType.startsWith('video/'))       return 'videocam';
  if (mimeType.startsWith('audio/'))       return 'audio_file';
  if (mimeType === 'application/pdf')      return 'picture_as_pdf';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar'))
                                           return 'folder_zip';
  if (mimeType.includes('word') || mimeType.includes('document'))
                                           return 'article';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
                                           return 'table_chart';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation'))
                                           return 'slideshow';
  if (mimeType.startsWith('text/'))        return 'description';
  return 'insert_drive_file';
}

/**
 * Checks whether `file` is allowed by the `accept` string.
 * Supports MIME types (`image/*`, `application/pdf`) and extensions (`.pdf`).
 */
export function isFileAccepted(file: File, accept: string): boolean {
  if (!accept.trim()) return true;
  const tokens = accept.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const mime   = file.type.toLowerCase();
  const ext    = '.' + file.name.split('.').pop()!.toLowerCase();

  return tokens.some((token) => {
    if (token.endsWith('/*')) return mime.startsWith(token.replace('/*', '/'));
    if (token.startsWith('.')) return ext === token;
    return mime === token;
  });
}
