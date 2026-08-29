import {
  ErrorHandler,
  Injectable,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import { PixelAnalyticsService } from '../core/analytics.service';

export interface PixelAnalyticsErrorTrackingOptions {
  /**
   * Forward to the previous / default ErrorHandler after tracking.
   * @default true
   */
  readonly forwardToDefault?: boolean;
  /**
   * @deprecated Use {@link forwardToDefault}. Kept for compatibility.
   * @default true
   */
  readonly rethrow?: boolean;
}

export const PIXEL_ANALYTICS_ERROR_OPTIONS =
  new InjectionToken<PixelAnalyticsErrorTrackingOptions>('PIXEL_ANALYTICS_ERROR_OPTIONS', {
    factory: () => ({}),
  });

/**
 * Opt-in global {@link ErrorHandler} that records `application.error` events and
 * delegates to the previous handler (or Angular's default).
 *
 * ```ts
 * providePixelAnalytics({ … }),
 * withErrorTracking(),
 * ```
 *
 * Register after any app-level ErrorHandler you want to wrap, or place analytics
 * providers in a child injector so `{ skipSelf: true }` resolves the parent handler.
 */
export function withErrorTracking(
  options: PixelAnalyticsErrorTrackingOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PIXEL_ANALYTICS_ERROR_OPTIONS, useValue: options },
    { provide: ErrorHandler, useClass: PixelAnalyticsErrorHandler },
  ]);
}

@Injectable()
export class PixelAnalyticsErrorHandler implements ErrorHandler {
  private readonly analytics = inject(PixelAnalyticsService, { optional: true });
  private readonly options = inject(PIXEL_ANALYTICS_ERROR_OPTIONS);
  private readonly next =
    inject(ErrorHandler, { skipSelf: true, optional: true }) ?? new ErrorHandler();

  handleError(error: unknown): void {
    try {
      this.analytics?.trackError(error, { handled: false });
    } catch {
      // never break the host error path
    }
    const forward =
      this.options.forwardToDefault ?? this.options.rethrow ?? true;
    if (!forward) {
      return;
    }
    this.next.handleError(error);
  }
}
