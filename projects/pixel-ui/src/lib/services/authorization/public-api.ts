// ─── Pixel Authorization — public surface (pixel-ui/authorization) ─────────────

export { PixelAuthorizationService } from './authorization.service';
export { default as PixelAccessDirective } from './pixel-access.directive';
export { PIXEL_ACCESS_PEP } from '../../shared/access-pep';
export type { PixelAccessPep } from '../../shared/access-pep';
export { providePixelAuthorization } from './provide-authorization';
export type { ProvidePixelAuthorizationOptions } from './provide-authorization';
export {
  PIXEL_AUTHORIZATION_AUDIT,
  PIXEL_AUTHORIZATION_CONFIG,
  PIXEL_AUTHORIZATION_REMOTE_PDP,
} from './authorization.tokens';
export type {
  PixelAuthorizationAudit,
  PixelAuthorizationAuditEvent,
  PixelPolicyDecisionAdapter,
} from './authorization.tokens';
export {
  PIXEL_AUTHORIZATION_DEFAULT_CONFIG,
} from './authorization.types';
export type {
  PixelAccessAction,
  PixelAccessDecision,
  PixelAccessDecisionStatus,
  PixelAccessExplainResult,
  PixelAccessExplainStep,
  PixelAuthorizationCatalogMode,
  PixelAuthorizationConfig,
  PixelAuthorizationContextStatus,
  PixelAuthorizationObligation,
  PixelAuthorizationObligationType,
  PixelAuthorizationReason,
  PixelAuthorizationRequest,
  PixelAuthorizationRequestContext,
  PixelAuthorizationResource,
  PixelAuthorizationSubject,
  PixelDeniedActionMode,
  PixelPermissionCatalog,
  PixelPermissionDefinition,
  PixelPolicy,
  PixelPolicyCondition,
  PixelPolicyStatus,
  PixelRole,
} from './authorization.types';
export {
  pixelAuthorizationCanActivate,
  pixelAuthorizationCanActivateChild,
  pixelAuthorizationCanMatch,
  readPixelRouteAccess,
} from './route.helpers';
export type {
  PixelAuthorizationGuardOptions,
  PixelRouteAccessData,
} from './route.helpers';
export {
  applyCurrentRouteAuthorization,
  providePixelAuthorizationRouteWatcher,
  reevaluateCurrentRouteAuthorization,
  PixelAuthorizationRouteWatcher,
} from './route.watcher';
export type {
  PixelAuthorizationRouteEvictReason,
  PixelAuthorizationRouteWatcherOptions,
} from './route.watcher';
export { createAuthorizationNavigateGuard } from './navigate.adapter';
export {
  PixelMockPolicyDecisionAdapter,
  withRemotePdpTimeout,
} from './policy.adapter';
export { seedPixelAuthorization, providePixelAuthorizationTesting } from './testing';
export {
  expandSubjectPermissions,
  isKnownPermission,
  permissionGranted,
} from './rbac.evaluator';
export {
  evaluatePolicyCondition,
  resolvePolicyPath,
} from './policy.engine';
export { evaluateAuthorization } from './authorization.evaluate';
