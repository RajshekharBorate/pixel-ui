import type {
  PixelAnalyticsEvent,
  PixelAnalyticsIdentifyInput,
  PixelAnalyticsPageContext,
} from '../core/analytics.types';

export interface PixelAnalyticsProviderContext {
  readonly debug: boolean;
}

export interface PixelAnalyticsProvider {
  readonly id: string;
  initialize?(context: PixelAnalyticsProviderContext): void | Promise<void>;
  /** Optional per-event hook (console debug). Batched providers may no-op. */
  track?(event: PixelAnalyticsEvent): void | Promise<void>;
  /** Preferred delivery path for HTTP and similar providers. */
  sendBatch?(events: readonly PixelAnalyticsEvent[], options?: { urgent?: boolean }): Promise<void>;
  identify?(input: PixelAnalyticsIdentifyInput): void | Promise<void>;
  page?(page: PixelAnalyticsPageContext, properties?: Record<string, unknown>): void | Promise<void>;
  flush?(): Promise<void>;
  shutdown?(): Promise<void>;
}

export class PixelAnalyticsProviderRouter {
  constructor(private readonly providers: readonly PixelAnalyticsProvider[]) {}

  async initialize(context: PixelAnalyticsProviderContext): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.initialize?.(context);
      } catch {
        // swallow
      }
    }
  }

  async track(event: PixelAnalyticsEvent): Promise<number> {
    let failures = 0;
    for (const provider of this.providers) {
      if (!provider.track) {
        continue;
      }
      try {
        await provider.track(event);
      } catch {
        failures += 1;
      }
    }
    return failures;
  }

  async sendBatch(
    events: readonly PixelAnalyticsEvent[],
    options?: { urgent?: boolean },
  ): Promise<number> {
    if (events.length === 0) {
      return 0;
    }
    let handlers = 0;
    let failures = 0;
    for (const provider of this.providers) {
      if (!provider.sendBatch) {
        continue;
      }
      handlers += 1;
      try {
        await provider.sendBatch(events, options);
      } catch {
        failures += 1;
      }
    }
    if (handlers === 0) {
      return 1;
    }
    return failures;
  }

  async identify(input: PixelAnalyticsIdentifyInput): Promise<number> {
    let failures = 0;
    for (const provider of this.providers) {
      if (!provider.identify) {
        continue;
      }
      try {
        await provider.identify(input);
      } catch {
        failures += 1;
      }
    }
    return failures;
  }

  async shutdown(): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.shutdown?.();
      } catch {
        // swallow
      }
    }
  }
}
