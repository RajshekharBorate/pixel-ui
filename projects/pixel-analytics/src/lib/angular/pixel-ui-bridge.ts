import type { PixelAnalyticsService } from '../core/analytics.service';

/**
 * Duck-typed adapter matching `PixelUiAnalyticsPort` from `pixel-ui`.
 * Wire it in the application:
 *
 * ```ts
 * import { PIXEL_UI_ANALYTICS } from 'pixel-ui';
 * import { createPixelUiAnalyticsPort, PixelAnalyticsService } from 'pixel-analytics';
 *
 * {
 *   provide: PIXEL_UI_ANALYTICS,
 *   useFactory: (analytics: PixelAnalyticsService) => createPixelUiAnalyticsPort(analytics),
 *   deps: [PixelAnalyticsService],
 * }
 * ```
 */
export interface PixelUiAnalyticsPortShape {
  track(input: {
    readonly name: string;
    readonly properties?: Record<string, unknown>;
    readonly component?: {
      readonly name?: string;
      readonly version?: string;
      readonly instanceId?: string;
    };
    readonly context?: {
      readonly correlation?: {
        readonly traceId?: string;
        readonly spanId?: string;
        readonly parentSpanId?: string;
        readonly interactionId?: string;
      };
    };
  }): void;
  beginInteraction?(name: string): { end(): void };
}

export function createPixelUiAnalyticsPort(
  analytics: PixelAnalyticsService,
): PixelUiAnalyticsPortShape {
  return {
    track(input) {
      analytics.track({
        name: input.name,
        properties: input.properties,
        context: {
          ...(input.component ? { component: input.component } : {}),
          ...(input.context ?? {}),
        },
      });
    },
    beginInteraction(name) {
      const handle = analytics.beginInteraction(name);
      return { end: () => handle.end() };
    },
  };
}
