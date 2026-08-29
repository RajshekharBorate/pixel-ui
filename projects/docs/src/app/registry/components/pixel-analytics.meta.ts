import { DocComponentMeta } from '../types';
import { ANALYTICS_EXAMPLES } from '../../examples/pixel-analytics';

export const ANALYTICS_META: DocComponentMeta = {
  id: 'pixel-analytics',
  title: 'Analytics',
  selector: 'PixelAnalyticsService',
  category: 'services',
  status: 'beta',
  kind: 'service',
  packageImportPath: 'pixel-analytics',
  summary:
    'Vendor-neutral analytics facade (pixel-analytics) — consent, privacy sanitization, queue/batch/retry, and HTTP-first delivery to your enterprise backend. Optional Pixel UI bridge covers forms, navigation, overlays, dates, files, editor, and charts.',
  overview: [
    'Separate package from pixel-ui. Default transport is batched HTTP POST of canonical JSON events; vendor SDKs are optional adapters, not the core.',
    'Pipeline: validate → sanitize → consent → sample → queue → batch → retry → providers (HTTP / console / custom via PIXEL_ANALYTICS_EXTRA_PROVIDERS).',
    'Bootstrap with providePixelAnalytics (app root) or createPixelAnalyticsProviders (component injectors / demos). Pair with withRouteTracking, withHttpTracking + pixelAnalyticsHttpInterceptor, withErrorTracking, and withPerformanceTracking as needed.',
    'Pixel UI stays decoupled: provide PIXEL_UI_ANALYTICS via createPixelUiAnalyticsPort(analytics). Components emit only when the port is present; labels, filenames, and document content stay out of payloads by default.',
    'Failures are recorded in analytics.diagnostics() and never thrown into host application code.',
  ],
  useCases: [
    'Enterprise product analytics with customer-owned ingest',
    'Consent-gated collection and PII redaction before egress',
    'Automatic page / HTTP / error / performance instrumentation',
    'Optional UI telemetry across Pixel form, nav, overlay, date, file, editor, and chart surfaces',
  ],
  themingNotes: [
    'No UI chrome — compose with Pixel UI components for interactive demos (see UI integration examples).',
  ],
  accessibilityNotes: [
    'Service layer has no DOM. Give tracked controls clear labels; prefer analyticsAction on pixel-button so click bubbling stays correct.',
  ],
  imports: [
    'PixelAnalyticsService',
    'providePixelAnalytics',
    'createPixelAnalyticsProviders',
    'PixelAnalyticsTrackDirective',
    'createPixelUiAnalyticsPort',
    'withRouteTracking',
    'withHttpTracking',
    'pixelAnalyticsHttpInterceptor',
    'withErrorTracking',
    'withPerformanceTracking',
  ],
  inputs: [],
  outputs: [],
  serviceName: 'PixelAnalyticsService',
  serviceApi: [
    {
      name: 'track',
      signature: 'track(input: PixelAnalyticsTrackInput): void',
      description: 'Record a canonical domain.object.action event through the full pipeline.',
    },
    {
      name: 'page',
      signature: 'page(input?: PixelAnalyticsPageInput): void',
      description: 'Emit navigation.page.view (used by withRouteTracking on NavigationEnd).',
    },
    {
      name: 'identify',
      signature: 'identify(input: PixelAnalyticsIdentifyInput): void',
      description: 'Attach userId / traits to identity for subsequent events.',
    },
    {
      name: 'setConsent',
      signature: 'setConsent(state: PixelAnalyticsConsentState): void',
      description: 'unknown | granted | denied — gates collection when consent.required is true.',
    },
    {
      name: 'trackError',
      signature: 'trackError(error: unknown, context?: PixelAnalyticsErrorContext): void',
      description: 'Record application.error for handled (or ErrorHandler) failures.',
    },
    {
      name: 'trackPerformance',
      signature: 'trackPerformance(input: PixelAnalyticsPerformanceInput): void',
      description: 'Custom timing / Web Vitals-shaped performance events (respects sampling).',
    },
    {
      name: 'flush',
      signature: 'flush(): Promise<void>',
      description: 'Force-send the current queue batch (also runs on unload).',
    },
    {
      name: 'diagnostics',
      signature: 'diagnostics(): PixelAnalyticsDiagnostics',
      description: 'Counters for created / queued / sent / dropped / sampled-out / provider failures.',
    },
  ],
  composeWith: ['pixel-button', 'pixel-dialog', 'pixel-data-grid'],
  readmePath: 'projects/pixel-analytics/README.md',
  sourcePaths: [
    'projects/pixel-analytics/src/public-api.ts',
    'projects/pixel-analytics/src/lib/core/analytics.service.ts',
    'projects/pixel-analytics/src/lib/angular/provide-analytics.ts',
  ],
  examples: ANALYTICS_EXAMPLES,
};
