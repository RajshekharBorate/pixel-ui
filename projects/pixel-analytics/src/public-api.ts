/*
 * Public API Surface of pixel-analytics
 */

export { PixelAnalyticsService } from './lib/core/analytics.service';
export {
  providePixelAnalytics,
  createPixelAnalyticsProviders,
  PIXEL_ANALYTICS_EXTRA_PROVIDERS,
} from './lib/angular/provide-analytics';
export {
  PIXEL_ANALYTICS_PROVIDERS,
  PIXEL_ANALYTICS_RESOLVED_CONFIG,
  PIXEL_ANALYTICS_CONFIG,
} from './lib/core/analytics.tokens';
export {
  withRouteTracking,
  type PixelAnalyticsRouteTrackingOptions,
} from './lib/angular/route-tracking';
export {
  withHttpTracking,
  pixelAnalyticsHttpInterceptor,
  PIXEL_ANALYTICS_HTTP_TRACKING,
  type PixelAnalyticsHttpTrackingOptions,
} from './lib/angular/http-tracking';
export {
  withErrorTracking,
  PixelAnalyticsErrorHandler,
  PIXEL_ANALYTICS_ERROR_OPTIONS,
  type PixelAnalyticsErrorTrackingOptions,
} from './lib/angular/error-tracking';
export {
  withPerformanceTracking,
  type PixelAnalyticsPerformanceTrackingOptions,
} from './lib/angular/performance-tracking';
export { PixelAnalyticsTrackDirective } from './lib/angular/analytics-track.directive';
export {
  createPixelUiAnalyticsPort,
  type PixelUiAnalyticsPortShape,
} from './lib/angular/pixel-ui-bridge';

export type { PixelAnalyticsInteractionHandle } from './lib/context/interaction.service';

export type {
  PixelAnalyticsEvent,
  PixelAnalyticsEventCategory,
  PixelAnalyticsEventContext,
  PixelAnalyticsCorrelationContext,
  PixelAnalyticsEntityContext,
  PixelAnalyticsTrackInput,
  PixelAnalyticsPageInput,
  PixelAnalyticsIdentifyInput,
  PixelAnalyticsPerformanceInput,
  PixelAnalyticsErrorContext,
  PixelAnalyticsConsentState,
  PixelAnalyticsDiagnostics,
  PixelAnalyticsIdentity,
} from './lib/core/analytics.types';

export type {
  PixelAnalyticsConfig,
  PixelAnalyticsHttpConfig,
  PixelAnalyticsPrivacyConfig,
  PixelAnalyticsConsentConfig,
  PixelAnalyticsQueueConfig,
  PixelAnalyticsSamplingConfig,
} from './lib/core/analytics.config';

export {
  PIXEL_ANALYTICS_SDK_NAME,
  PIXEL_ANALYTICS_SDK_VERSION,
} from './lib/core/analytics.tokens';

export { PIXEL_ANALYTICS_SCHEMA_VERSION } from './lib/core/analytics.types';

export type { PixelAnalyticsProvider } from './lib/providers/analytics-provider';
export { PixelAnalyticsConsoleProvider } from './lib/providers/console.provider';
export { PixelAnalyticsHttpProvider } from './lib/providers/http.provider';
export { PixelAnalyticsNoopProvider } from './lib/providers/noop.provider';

export {
  PIXEL_ANALYTICS_EVENT_REGISTRY,
  PIXEL_ANALYTICS_EVENT_CATALOG,
  PIXEL_ANALYTICS_REGISTRY,
  PixelAnalyticsRegistry,
  registerPixelAnalyticsEvents,
  getPixelAnalyticsEventDefinition,
  isRegisteredPixelAnalyticsEvent,
} from './lib/events/event-registry';

export type {
  PixelAnalyticsEventDefinition,
  PixelAnalyticsPropertyDefinition,
} from './lib/events/event-registry';

export {
  createAnalyticsTestingController,
  type PixelAnalyticsTestingController,
} from './lib/testing/testing';

export { isSampledOut, shouldSampleAnalyticsEvent } from './lib/pipeline/validator';

export type { PixelAnalyticsGroupInput } from './lib/core/analytics.types';
