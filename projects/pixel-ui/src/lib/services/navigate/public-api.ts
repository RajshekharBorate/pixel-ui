// ─── Pixel Navigate — public surface ───────────────────────────────────────────

export { PixelNavigateService } from './navigate.service';
export { PIXEL_NAVIGATE_ANALYTICS, PIXEL_NAVIGATE_CONFIG } from './navigate.tokens';
export { PIXEL_NAVIGATE_DEFAULTS } from './navigate.types';
export type {
  PixelNavActivationAdapter,
  PixelNavigateAnalytics,
  PixelNavigateAnalyticsEvent,
  PixelNavigateConfig,
  PixelNavigateContextEntry,
  PixelNavigateFailureMode,
  PixelNavigateFailureReason,
  PixelNavigateHistoryMode,
  PixelNavigatePermissionGuard,
  PixelNavigateRequest,
  PixelNavigateResult,
  PixelNavigateScrollBehavior,
  PixelNavGridRevealApi,
  PixelNavTarget,
  PixelNavWizardAdapter,
  PixelNavWizardContext,
  ResolvedPixelNavigateConfig,
} from './navigate.types';

export {
  coerceNavigateRequest,
  navigateRequestToUrl,
  normalizeTargets,
  parseNavParam,
  parseNavigateUrl,
  serializeNavTargets,
  targetsFromFirstClass,
} from './navigate-url';

export {
  PixelNavAnchorRegistry,
} from './navigate-anchor';
export { default as PixelNavAnchorDirective } from './navigate-anchor';

export {
  getNotificationNavigateRequest,
  openNotificationTarget,
} from './notification-nav';
export type { OpenNotificationTargetOptions } from './notification-nav';
