import {
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PixelAnalyticsService } from '../core/analytics.service';
import { PixelAnalyticsContextService } from '../context/context.service';
import { PIXEL_ANALYTICS_RESOLVED_CONFIG } from '../core/analytics.tokens';
import { sanitizeAnalyticsUrl } from '../privacy/sanitizer';

export interface PixelAnalyticsRouteTrackingOptions {
  /** Include query string in tracked page URL. @default false */
  readonly trackQuery?: boolean;
  /**
   * Emit `navigation.route.change` (+ optional transition timing) in addition to
   * `navigation.page.view`. @default false
   */
  readonly trackRouteChange?: boolean;
  /** Also record route transition duration when route-change tracking is on. @default true */
  readonly trackDuration?: boolean;
}

/**
 * Opt-in Angular Router instrumentation. Emits privacy-safe page/route events on
 * `NavigationEnd`. Requires `@angular/router`.
 *
 * ```ts
 * providePixelAnalytics({ … }),
 * withRouteTracking({ trackQuery: false }),
 * ```
 */
export function withRouteTracking(
  options: PixelAnalyticsRouteTrackingOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        const router = inject(Router);
        const analytics = inject(PixelAnalyticsService);
        const context = inject(PixelAnalyticsContextService);
        const config = inject(PIXEL_ANALYTICS_RESOLVED_CONFIG);
        const destroyRef = inject(DestroyRef);
        const trackQuery = options.trackQuery ?? false;
        const trackRouteChange = options.trackRouteChange ?? false;
        const trackDuration = options.trackDuration ?? true;

        let navigationStartedAt = 0;
        router.events.pipe(takeUntilDestroyed(destroyRef)).subscribe((event) => {
          if (event instanceof NavigationStart) {
            navigationStartedAt = performance.now?.() ?? Date.now();
          }
        });

        router.events
          .pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            takeUntilDestroyed(destroyRef),
          )
          .subscribe((event) => {
            try {
              const allowQuery = trackQuery || config.privacy.allowQueryParams;
              const pathOnly = event.urlAfterRedirects.split('?')[0] ?? event.urlAfterRedirects;
              const page = context.buildPageContext(
                {
                  path: pathOnly,
                  route: pathOnly,
                },
                {
                  allowQueryParams: allowQuery,
                  stripUrlHash: config.privacy.stripUrlHash,
                },
              );
              context.setContext({ page });
              const sanitizedRedirect = sanitizeAnalyticsUrl(
                allowQuery ? event.urlAfterRedirects : pathOnly,
                config,
              );
              analytics.page({
                context: { page },
                properties: {
                  ...(sanitizedRedirect ? { path: sanitizedRedirect } : {}),
                },
              });
              if (trackRouteChange) {
                const durationMs =
                  trackDuration && navigationStartedAt > 0
                    ? Math.round((performance.now?.() ?? Date.now()) - navigationStartedAt)
                    : undefined;
                analytics.track({
                  name: 'navigation.route.change',
                  category: 'navigation',
                  properties: {
                    path: page?.path,
                    ...(durationMs !== undefined ? { durationMs } : {}),
                  },
                  context: { page },
                });
                if (trackDuration && durationMs !== undefined) {
                  analytics.track({
                    name: 'performance.route.transition',
                    category: 'performance',
                    properties: {
                      path: page?.path,
                      durationMs,
                    },
                  });
                }
              }
            } catch {
              // Analytics must never break navigation.
            }
          });
      },
    },
  ]);
}
