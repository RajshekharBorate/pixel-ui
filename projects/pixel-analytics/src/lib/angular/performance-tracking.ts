import {
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import { PixelAnalyticsService } from '../core/analytics.service';
import { isBrowser } from '../core/analytics.utils';

export interface PixelAnalyticsPerformanceTrackingOptions {
  /** Emit Navigation Timing `performance.page.load`. @default true */
  readonly pageLoad?: boolean;
  /**
   * Observe LCP / CLS when PerformanceObserver supports them.
   * No external web-vitals dependency. @default true
   */
  readonly webVitals?: boolean;
}

/**
 * Opt-in performance instrumentation: page load timing and lightweight Web Vitals.
 *
 * ```ts
 * providePixelAnalytics({ … }),
 * withPerformanceTracking({ webVitals: true }),
 * ```
 *
 * High-volume vitals are subject to the service sampling config (`performanceRate`).
 */
export function withPerformanceTracking(
  options: PixelAnalyticsPerformanceTrackingOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        if (!isBrowser()) {
          return;
        }
        const analytics = inject(PixelAnalyticsService);
        const destroyRef = inject(DestroyRef);
        const pageLoad = options.pageLoad ?? true;
        const webVitals = options.webVitals ?? true;

        if (pageLoad) {
          schedulePageLoad(analytics);
        }
        if (webVitals) {
          observeWebVitals(analytics, destroyRef);
        }
      },
    },
  ]);
}

function schedulePageLoad(analytics: PixelAnalyticsService): void {
  const emit = (): void => {
    try {
      const nav = performance.getEntriesByType?.('navigation')?.[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (!nav) {
        return;
      }
      analytics.track({
        name: 'performance.page.load',
        category: 'performance',
        properties: {
          durationMs: Math.round(nav.loadEventEnd || nav.duration),
          domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
          ttfbMs: Math.round(nav.responseStart),
          transferSize: nav.transferSize,
        },
      });
    } catch {
      // ignore
    }
  };

  if (document.readyState === 'complete') {
    queueMicrotask(emit);
  } else {
    window.addEventListener('load', emit, { once: true });
  }
}

function observeWebVitals(analytics: PixelAnalyticsService, destroyRef: DestroyRef): void {
  if (typeof PerformanceObserver === 'undefined') {
    return;
  }

  const report = (metric: string, value: number): void => {
    try {
      analytics.track({
        name: 'performance.web_vitals',
        category: 'performance',
        properties: {
          metric,
          value: Math.round(value * 100) / 100,
        },
      });
    } catch {
      // ignore
    }
  };

  const cleanups: Array<() => void> = [];

  try {
    let lastLcp = 0;
    let lcpFlushed = false;
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        lastLcp = last.startTime;
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    const flushLcp = (): void => {
      if (lcpFlushed) {
        return;
      }
      lcpFlushed = true;
      if (lastLcp > 0) {
        report('LCP', lastLcp);
      }
      lcpObserver.disconnect();
    };
    const onHidden = (): void => {
      if (document.visibilityState === 'hidden') {
        flushLcp();
      }
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', flushLcp, { once: true });
    cleanups.push(() => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', flushLcp);
      lcpObserver.disconnect();
    });
  } catch {
    // unsupported
  }

  try {
    let cls = 0;
    let clsFlushed = false;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
        if (!shift.hadRecentInput) {
          cls += shift.value ?? 0;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    const flushCls = (): void => {
      if (clsFlushed) {
        return;
      }
      clsFlushed = true;
      report('CLS', cls);
      clsObserver.disconnect();
    };
    const onHidden = (): void => {
      if (document.visibilityState === 'hidden') {
        flushCls();
      }
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', flushCls, { once: true });
    cleanups.push(() => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', flushCls);
      clsObserver.disconnect();
    });
  } catch {
    // unsupported
  }

  destroyRef.onDestroy(() => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  });
}
