import { InjectionToken } from '@angular/core';
import type { PixelFileTransferConfig } from './file-transfer.types';
import type { PixelUploadAdapter } from './adapters/upload-adapter.interface';
import type { PixelDownloadAdapter } from './adapters/download-adapter.interface';

/**
 * Global configuration for the file-transfer framework. Provide once at app/root:
 *
 * ```ts
 * provideAppInitializer; // not needed — just add to providers:
 * { provide: PIXEL_FILE_TRANSFER_CONFIG, useValue: { uploadUrl: '/api/upload', retryCount: 5 } }
 * ```
 */
export const PIXEL_FILE_TRANSFER_CONFIG = new InjectionToken<PixelFileTransferConfig>(
  'PIXEL_FILE_TRANSFER_CONFIG',
);

/**
 * Override the default REST upload adapter. Supply a class instance implementing
 * `PixelUploadAdapter` (e.g. an S3 presigned-URL adapter).
 */
export const PIXEL_UPLOAD_ADAPTER = new InjectionToken<PixelUploadAdapter>(
  'PIXEL_UPLOAD_ADAPTER',
);

/** Override the default REST download adapter. */
export const PIXEL_DOWNLOAD_ADAPTER = new InjectionToken<PixelDownloadAdapter>(
  'PIXEL_DOWNLOAD_ADAPTER',
);
