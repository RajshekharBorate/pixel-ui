// ─── Pixel File Transfer Framework — public surface ─────────────────────────────

// Services
export { PixelFileTransferService } from './file-transfer.service';
export { PixelUploadService } from './upload.service';
export { PixelDownloadService } from './download.service';
export { PixelFileTransferStore } from './file-transfer.store';
export { PixelOfflineQueueService } from './offline-queue.service';

// Adapters
export { PixelRestAdapter } from './adapters/rest-adapter';
export type { PixelUploadAdapter, PixelUploadProgress } from './adapters/upload-adapter.interface';
export type { PixelDownloadAdapter, PixelDownloadProgress } from './adapters/download-adapter.interface';

// DI tokens
export {
  PIXEL_FILE_TRANSFER_CONFIG,
  PIXEL_UPLOAD_ADAPTER,
  PIXEL_DOWNLOAD_ADAPTER,
} from './file-transfer.tokens';

// Types
export type {
  PixelTransferStatus,
  PixelTransferError,
  PixelTransferErrorKind,
  PixelUploadFile,
  PixelDownloadFile,
  PixelUploadResponse,
  PixelUploadTask,
  PixelDownloadTask,
  PixelFileTransferConfig,
  ResolvedFileTransferConfig,
  PixelUploadOptions,
  PixelDownloadOptions,
  PixelUploadValidator,
  PixelDownloadValidator,
} from './file-transfer.types';
export { PIXEL_FILE_TRANSFER_DEFAULTS } from './file-transfer.types';

// Utils
export {
  pixelTransferId,
  formatBytes,
  saveBlob,
  fileNameFromUrl,
  toTransferError,
} from './utils/file-utils';
export { isFileAccepted } from './utils/accept.util';
