import { Injectable, signal, type Provider } from '@angular/core';
import type { PixelAnalyticsEvent } from '../core/analytics.types';
import type { PixelAnalyticsProvider } from '../providers/analytics-provider';
import { PIXEL_ANALYTICS_EXTRA_PROVIDERS } from '../angular/provide-analytics';

/**
 * In-memory capture sink for unit / component tests.
 *
 * ```ts
 * const controller = createAnalyticsTestingController();
 * TestBed.configureTestingModule({
 *   providers: [
 *     ...createPixelAnalyticsProviders({ …, consent: { required: false } }),
 *     ...controller.providers,
 *   ],
 * });
 * // act…
 * expect(controller.events().some((e) => e.name === 'ui.button.click')).toBe(true);
 * ```
 */
export interface PixelAnalyticsTestingController {
  readonly events: () => readonly PixelAnalyticsEvent[];
  readonly clear: () => void;
  readonly providers: Provider[];
}

@Injectable()
class AnalyticsTestingCaptureStore {
  readonly events = signal<readonly PixelAnalyticsEvent[]>([]);

  push(event: PixelAnalyticsEvent): void {
    this.events.update((list) => [...list, event]);
  }

  clear(): void {
    this.events.set([]);
  }
}

export function createAnalyticsTestingController(): PixelAnalyticsTestingController {
  const store = new AnalyticsTestingCaptureStore();
  const provider: PixelAnalyticsProvider = {
    id: 'testing-capture',
    track(event) {
      store.push(event);
    },
  };

  return {
    events: () => store.events(),
    clear: () => store.clear(),
    providers: [
      { provide: AnalyticsTestingCaptureStore, useValue: store },
      {
        provide: PIXEL_ANALYTICS_EXTRA_PROVIDERS,
        useValue: [provider],
      },
    ],
  };
}
