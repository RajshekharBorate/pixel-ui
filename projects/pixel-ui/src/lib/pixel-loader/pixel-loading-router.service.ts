import { DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { PixelLoaderService } from './pixel-loader.service';
import { type PixelLoadingRouterConfig } from './pixel-loader.types';

/** Injection token for router loader configuration. */
export const PIXEL_LOADING_ROUTER_CONFIG = new InjectionToken<PixelLoadingRouterConfig>(
  'PIXEL_LOADING_ROUTER_CONFIG',
);

const DEFAULT_ROUTER_CONFIG: Required<PixelLoadingRouterConfig> = {
  enabled: true,
  showDelay: 200,
  minimumDuration: 400,
  type: 'spinner',
  label: 'Loading page…',
};

/**
 * Router integration that displays a route-scoped loader during navigation.
 */
@Injectable({ providedIn: 'root' })
export class PixelLoadingRouterService {
  private readonly router = inject(Router);
  private readonly loader = inject(PixelLoaderService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly config = signal<Required<PixelLoadingRouterConfig>>(DEFAULT_ROUTER_CONFIG);
  private activeNavigationId: string | null = null;

  /** Whether a route transition is in progress. */
  readonly isNavigating = signal(false);

  /** Configure router loader behaviour. */
  configure(partial: PixelLoadingRouterConfig): void {
    this.config.update((current) => ({ ...current, ...partial }));
  }

  /** Begin listening to router events. */
  init(): void {
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (!this.config().enabled) {
          return;
        }

        if (event instanceof NavigationStart) {
          this.onNavigationStart();
          return;
        }

        this.onNavigationEnd();
      });
  }

  private onNavigationStart(): void {
    if (this.activeNavigationId) {
      return;
    }
    this.isNavigating.set(true);
    this.activeNavigationId = this.loader.show({
      scope: 'route',
      label: this.config().label,
      type: this.config().type,
      meta: { source: 'router' },
    });
  }

  private onNavigationEnd(): void {
    if (!this.activeNavigationId) {
      this.isNavigating.set(false);
      return;
    }

    const id = this.activeNavigationId;
    this.activeNavigationId = null;
    this.isNavigating.set(false);
    this.loader.hide(id);
  }
}

/** Provide router loader defaults. */
export function providePixelLoadingRouter(config: PixelLoadingRouterConfig) {
  return {
    provide: PIXEL_LOADING_ROUTER_CONFIG,
    useValue: config,
  };
}

/** Bootstrap helper — initializes router loading in one call. */
export function initPixelLoadingRouter(config?: PixelLoadingRouterConfig): () => void {
  return () => {
    const service = inject(PixelLoadingRouterService);
    if (config) {
      service.configure(config);
    }
    service.init();
  };
}
