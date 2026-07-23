import { InjectionToken } from '@angular/core';
import type { PixelExportConfig } from './export.types';

/** Optional global defaults for {@link PixelExportService}. */
export const PIXEL_EXPORT_CONFIG = new InjectionToken<PixelExportConfig>('PIXEL_EXPORT_CONFIG');
