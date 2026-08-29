import type { PixelAnalyticsEvent } from '../core/analytics.types';
import type { PixelAnalyticsProvider } from './analytics-provider';

export class PixelAnalyticsNoopProvider implements PixelAnalyticsProvider {
  readonly id = 'noop';

  track(_event: PixelAnalyticsEvent): void {
    // intentionally empty
  }
}
