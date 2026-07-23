import { InjectionToken } from '@angular/core';
import type { PixelNavigateAnalytics, PixelNavigateConfig } from './navigate.types';

/** Optional partial defaults for {@link PixelNavigateService}. */
export const PIXEL_NAVIGATE_CONFIG = new InjectionToken<Partial<PixelNavigateConfig>>(
  'PIXEL_NAVIGATE_CONFIG',
);

/** Optional analytics sink for navigate lifecycle events. */
export const PIXEL_NAVIGATE_ANALYTICS = new InjectionToken<PixelNavigateAnalytics>(
  'PIXEL_NAVIGATE_ANALYTICS',
);
