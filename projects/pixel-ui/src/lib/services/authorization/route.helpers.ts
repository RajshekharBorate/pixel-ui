import { inject } from '@angular/core';
import {
  type CanActivateChildFn,
  type CanActivateFn,
  type CanMatchFn,
  Router,
  type ActivatedRouteSnapshot,
  type Route,
  type UrlSegment,
  type UrlTree,
} from '@angular/router';
import { PixelAuthorizationService } from './authorization.service';
import type { PixelAuthorizationRequest } from './authorization.types';

export type PixelRouteAccessData = {
  /** Permission key (shorthand). */
  readonly access?: string;
  /** Full ABAC request — wins over `access` when both set. */
  readonly accessRequest?: PixelAuthorizationRequest;
};

export type PixelAuthorizationGuardOptions = {
  readonly loginUrl?: string;
  readonly forbiddenUrl?: string;
};

/** Reads `data.accessRequest` or shorthand `data.access` from a route. */
export function readPixelRouteAccess(
  data: Record<string, unknown> | undefined,
): PixelAuthorizationRequest | null {
  if (!data) {
    return null;
  }
  const accessRequest = data['accessRequest'] as PixelAuthorizationRequest | undefined;
  if (accessRequest) {
    return accessRequest;
  }
  const access = data['access'];
  if (typeof access === 'string' && access.trim()) {
    return { permission: access.trim(), action: 'navigate' };
  }
  return null;
}

function redirect(
  router: Router,
  auth: PixelAuthorizationService,
  options: PixelAuthorizationGuardOptions,
  reason: 'unauthenticated' | 'forbidden',
): boolean | UrlTree {
  if (reason === 'unauthenticated' && options.loginUrl) {
    return router.parseUrl(options.loginUrl);
  }
  if (options.forbiddenUrl) {
    return router.parseUrl(options.forbiddenUrl);
  }
  // Soft deny — block activation without redirect when URLs unset
  void auth;
  return false;
}

function evaluateRouteAccess(
  data: Record<string, unknown> | undefined,
  options: PixelAuthorizationGuardOptions,
): boolean | UrlTree {
  const auth = inject(PixelAuthorizationService);
  const router = inject(Router);
  const request = readPixelRouteAccess(data);
  if (!request) {
    return true;
  }
  const status = auth.contextStatus();
  if (status === 'unauthenticated') {
    return redirect(router, auth, options, 'unauthenticated');
  }
  if (status === 'unknown' || status === 'loading') {
    // Fail-closed for route entry while hydrating — prefer login/forbidden or block
    return redirect(router, auth, options, 'forbidden');
  }
  const decision = auth.authorize(request);
  if (decision.status === 'allow') {
    return true;
  }
  return redirect(router, auth, options, 'forbidden');
}

/** Lazy-load gate — prefer for admin chunks (D14). */
export function pixelAuthorizationCanMatch(
  options: PixelAuthorizationGuardOptions = {},
): CanMatchFn {
  return (_route: Route, _segments: UrlSegment[]) =>
    evaluateRouteAccess(_route.data as Record<string, unknown> | undefined, options);
}

export function pixelAuthorizationCanActivate(
  options: PixelAuthorizationGuardOptions = {},
): CanActivateFn {
  return (route: ActivatedRouteSnapshot) =>
    evaluateRouteAccess(route.data as Record<string, unknown>, options);
}

export function pixelAuthorizationCanActivateChild(
  options: PixelAuthorizationGuardOptions = {},
): CanActivateChildFn {
  return (child: ActivatedRouteSnapshot) =>
    evaluateRouteAccess(child.data as Record<string, unknown>, options);
}
