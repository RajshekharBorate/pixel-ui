import {
  ENVIRONMENT_INITIALIZER,
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { PixelLoadingService } from './pixel-loading.service';

/** Options for {@link providePixelRouteLoading}. */
export interface PixelRouteLoadingOptions {
  /** Message shown while a navigation is in flight. Default `'Loading…'`. */
  readonly message?: string;
  /** Scope label applied to route tasks. Default `'route'`. */
  readonly scope?: string;
}

/** Stable id used for the single in-flight route task. */
const ROUTE_TASK_ID = 'pixel-route-loading';

/**
 * Wires Angular Router navigation events into {@link PixelLoadingService} so the global loader
 * shows during route transitions (including lazy-module loading) and hides on
 * `NavigationEnd` / `NavigationCancel` / `NavigationError`. Add it to the app providers:
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideRouter(routes),
 *     providePixelRouteLoading({ message: 'Loading page…' }),
 *   ],
 * });
 * ```
 *
 * Bind a global overlay to `loadingService.isLoading('route')` (or just `active()`).
 */
export function providePixelRouteLoading(
  options: PixelRouteLoadingOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        const router = inject(Router);
        const loading = inject(PixelLoadingService);
        const message = options.message ?? 'Loading…';
        const scope = options.scope ?? 'route';

        router.events.subscribe((event) => {
          if (event instanceof NavigationStart) {
            loading.start({ message, scope }, ROUTE_TASK_ID);
          } else if (
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
          ) {
            loading.stop(ROUTE_TASK_ID);
          }
        });
      },
    },
  ]);
}
