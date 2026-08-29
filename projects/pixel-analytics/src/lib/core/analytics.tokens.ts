import { InjectionToken } from '@angular/core';
import type { PixelAnalyticsConfig, PixelAnalyticsHttpConfig, ResolvedPixelAnalyticsConfig } from './analytics.config';
import type { PixelAnalyticsProvider } from '../providers/analytics-provider';

/** Root analytics configuration token. */
export const PIXEL_ANALYTICS_CONFIG = new InjectionToken<PixelAnalyticsConfig>(
  'PIXEL_ANALYTICS_CONFIG',
);

/** HTTP batch transport configuration. */
export const PIXEL_ANALYTICS_HTTP_CONFIG = new InjectionToken<PixelAnalyticsHttpConfig>(
  'PIXEL_ANALYTICS_HTTP_CONFIG',
);

/** Resolved config with defaults applied — internal use. */
export const PIXEL_ANALYTICS_RESOLVED_CONFIG =
  new InjectionToken<ResolvedPixelAnalyticsConfig>('PIXEL_ANALYTICS_RESOLVED_CONFIG');

/** Registered analytics providers (console, http, noop, …). */
export const PIXEL_ANALYTICS_PROVIDERS = new InjectionToken<readonly PixelAnalyticsProvider[]>(
  'PIXEL_ANALYTICS_PROVIDERS',
);

export const PIXEL_ANALYTICS_SDK_VERSION = '0.0.1';
export const PIXEL_ANALYTICS_SDK_NAME = 'pixel-analytics';
