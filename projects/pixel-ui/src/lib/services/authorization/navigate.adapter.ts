import type { PixelNavigatePermissionGuard } from '../navigate/navigate.types';
import type { PixelAuthorizationService } from './authorization.service';

/**
 * Bridges {@link PixelAuthorizationService} into {@link PixelNavigateService.setPermissionGuard}.
 * Precedence remains: `request.canActivate` → global guard → default allow.
 */
export function createAuthorizationNavigateGuard(
  auth: PixelAuthorizationService,
  mapAccess?: (req: Parameters<PixelNavigatePermissionGuard>[0]) => string | undefined,
): PixelNavigatePermissionGuard {
  return (req) => {
    const permission = mapAccess?.(req) ?? req.access;
    if (!permission?.trim()) {
      return true;
    }
    const routeId =
      req.resourceId ??
      (req.route?.length
        ? req.route.map((segment) => String(segment)).join('/')
        : undefined);
    const run = (): boolean => {
      const decision = auth.evaluate({
        action: 'navigate',
        permission: permission.trim(),
        resource: { type: 'route', id: routeId },
      });
      return decision.status === 'allow';
    };
    const status = auth.contextStatus();
    if (status === 'unknown' || status === 'loading') {
      return auth.whenContextReady().then(run);
    }
    return run();
  };
}
