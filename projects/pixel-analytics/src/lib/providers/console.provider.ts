import type { PixelAnalyticsEvent } from '../core/analytics.types';
import type { PixelAnalyticsProvider, PixelAnalyticsProviderContext } from './analytics-provider';

export class PixelAnalyticsConsoleProvider implements PixelAnalyticsProvider {
  readonly id = 'console';
  private debug = false;

  initialize(context: PixelAnalyticsProviderContext): void {
    this.debug = context.debug;
  }

  track(event: PixelAnalyticsEvent): void {
    if (!this.debug) {
      return;
    }
    // eslint-disable-next-line no-console
    console.debug('[pixel-analytics]', event.name, event);
  }
}
