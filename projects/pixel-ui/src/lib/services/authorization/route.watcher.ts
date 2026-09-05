import {
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  InjectionToken,
  Injectable,
  effect,
  inject,
  untracked,
  type Provider,
} from '@angular/core';
import {
  Router,
  type ActivatedRouteSnapshot,
  type UrlTree,
} from '@angular/router';
import { PixelAuthorizationService } from './authorization.service';
import type { PixelAuthorizationRequest } from './authorization.types';
import {
  type PixelAuthorizationGuardOptions,
  readPixelRouteAccess,
} from './route.helpers';

export type PixelAuthorizationRouteEvictReason = 'unauthenticated' | 'forbidden';

export type PixelAuthorizationRouteWatcherOptions = PixelAuthorizationGuardOptions & {
  /**
   * When true (default), eviction uses `replaceUrl` so Back does not return to the denied page.
   */
  readonly replaceUrl?: boolean;
  /** Fired after a successful redirect off a now-denied route. Do not pass permission keys. */
  readonly onEvicted?: (info: {
    readonly reason: PixelAuthorizationRouteEvictReason;
    readonly url: string;
  }) => void;
};

export const PIXEL_AUTHORIZATION_ROUTE_WATCHER_OPTIONS =
  new InjectionToken<PixelAuthorizationRouteWatcherOptions>(
    'PIXEL_AUTHORIZATION_ROUTE_WATCHER_OPTIONS',
  );

function collectRouteAccessRequests(
  snapshot: ActivatedRouteSnapshot | null,
): PixelAuthorizationRequest[] {
  const requests: PixelAuthorizationRequest[] = [];
  const visit = (node: ActivatedRouteSnapshot | null): void => {
    if (!node) {
      return;
    }
    const request = readPixelRouteAccess(node.data as Record<string, unknown>);
    if (request) {
      requests.push(request);
    }
    for (const child of node.children) {
      visit(child);
    }
  };
  visit(snapshot);
  return requests;
}

function pathOf(router: Router, url: string): string {
  const tree = router.parseUrl(url);
  tree.queryParams = {};
  tree.fragment = null;
  return router.serializeUrl(tree);
}

function alreadyAt(router: Router, targetUrl: string): boolean {
  return pathOf(router, router.url) === pathOf(router, targetUrl);
}

function redirectTree(
  router: Router,
  options: PixelAuthorizationGuardOptions,
  reason: PixelAuthorizationRouteEvictReason,
): UrlTree | null {
  if (reason === 'unauthenticated' && options.loginUrl) {
    return router.parseUrl(options.loginUrl);
  }
  if (options.forbiddenUrl) {
    return router.parseUrl(options.forbiddenUrl);
  }
  if (options.loginUrl) {
    return router.parseUrl(options.loginUrl);
  }
  return null;
}

/**
 * Re-check the **active** route tree after subject / catalog / policy changes.
 *
 * Unlike `canActivate` (entry-only), this is for staying on a URL when the person
 * loses access (role switch, logout, tenant change). While `contextStatus` is
 * `unknown` / `loading`, the current page is left in place (no hydration bounce).
 *
 * Returns `true` to stay, or a `UrlTree` the caller should navigate to.
 * Does not navigate by itself.
 */
export function reevaluateCurrentRouteAuthorization(
  auth: PixelAuthorizationService,
  router: Router,
  options: PixelAuthorizationGuardOptions = {},
): true | UrlTree {
  const requests = collectRouteAccessRequests(router.routerState.snapshot.root);
  if (requests.length === 0) {
    return true;
  }

  const status = auth.contextStatus();
  if (status === 'unknown' || status === 'loading') {
    return true;
  }

  if (status === 'unauthenticated') {
    const tree = redirectTree(router, options, 'unauthenticated');
    return tree ?? true;
  }

  for (const request of requests) {
    const decision = auth.evaluate(request);
    if (decision.status === 'allow') {
      continue;
    }
    const tree = redirectTree(router, options, 'forbidden');
    return tree ?? true;
  }
  return true;
}

/**
 * Apply {@link reevaluateCurrentRouteAuthorization} and navigate when the current
 * page is now denied. No-ops when already on the fallback URL.
 */
export async function applyCurrentRouteAuthorization(
  auth: PixelAuthorizationService,
  router: Router,
  options: PixelAuthorizationRouteWatcherOptions = {},
): Promise<boolean> {
  const result = reevaluateCurrentRouteAuthorization(auth, router, options);
  if (result === true) {
    return true;
  }
  const target = router.serializeUrl(result);
  if (alreadyAt(router, target)) {
    return true;
  }
  const status = auth.contextStatus();
  const reason: PixelAuthorizationRouteEvictReason =
    status === 'unauthenticated' ? 'unauthenticated' : 'forbidden';
  await router.navigateByUrl(result, { replaceUrl: options.replaceUrl !== false });
  options.onEvicted?.({ reason, url: target });
  return false;
}

/**
 * Opt-in watcher: when identity/catalog/policies change, leave the current page
 * if its `data.access` / `data.accessRequest` is now denied.
 *
 * Provide on a route or in `bootstrapApplication` — not inside `setSubject`.
 * Requires `forbiddenUrl` (or `loginUrl`) or eviction is a no-op.
 */
export function providePixelAuthorizationRouteWatcher(
  options: PixelAuthorizationRouteWatcherOptions | (() => PixelAuthorizationRouteWatcherOptions) = {},
): Provider[] {
  const optionsProvider =
    typeof options === 'function'
      ? { provide: PIXEL_AUTHORIZATION_ROUTE_WATCHER_OPTIONS, useFactory: options }
      : { provide: PIXEL_AUTHORIZATION_ROUTE_WATCHER_OPTIONS, useValue: options };
  return [
    optionsProvider,
    PixelAuthorizationRouteWatcher,
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useFactory: () => {
        const watcher = inject(PixelAuthorizationRouteWatcher);
        return () => watcher.ensureStarted();
      },
    },
  ];
}

/**
 * Opt-in watcher constructed by {@link providePixelAuthorizationRouteWatcher}.
 * Apps should not inject this class unless the watcher is provided on a component injector.
 */
@Injectable()
export class PixelAuthorizationRouteWatcher {
  private readonly auth = inject(PixelAuthorizationService);
  private readonly router = inject(Router);
  private readonly options = inject(PIXEL_AUTHORIZATION_ROUTE_WATCHER_OPTIONS, {
    optional: true,
  });
  private readonly destroyRef = inject(DestroyRef);
  private started = false;

  /** Idempotent; invoked by the environment initializer. */
  ensureStarted(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    const ref = effect(() => {
      this.auth.snapshotVersion();
      untracked(() => {
        void applyCurrentRouteAuthorization(this.auth, this.router, this.options ?? {});
      });
    });
    this.destroyRef.onDestroy(() => ref.destroy());
  }
}
