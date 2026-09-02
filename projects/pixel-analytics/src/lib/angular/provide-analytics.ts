import {
  EnvironmentProviders,
  InjectionToken,
  Optional,
  makeEnvironmentProviders,
  type Provider,
} from '@angular/core';
import {
  type PixelAnalyticsConfig,
  resolvePixelAnalyticsConfig,
} from '../core/analytics.config';
import {
  PIXEL_ANALYTICS_CONFIG,
  PIXEL_ANALYTICS_HTTP_CONFIG,
  PIXEL_ANALYTICS_PROVIDERS,
  PIXEL_ANALYTICS_RESOLVED_CONFIG,
} from '../core/analytics.tokens';
import { PixelAnalyticsConsoleProvider } from '../providers/console.provider';
import { PixelAnalyticsHttpProvider } from '../providers/http.provider';
import { PixelAnalyticsNoopProvider } from '../providers/noop.provider';
import type { PixelAnalyticsProvider } from '../providers/analytics-provider';
import { PixelAnalyticsConsentService } from '../privacy/consent.service';
import { PixelAnalyticsContextService } from '../context/context.service';
import { PixelAnalyticsInteractionService } from '../context/interaction.service';
import { PixelAnalyticsIdentityService } from '../identity/identity.service';
import { PixelAnalyticsService } from '../core/analytics.service';
import {
  PIXEL_ANALYTICS_REGISTRY,
  PixelAnalyticsRegistry,
} from '../events/event-registry';

/**
 * Extra destination providers merged after the built-in noop/console/http set.
 * Useful for docs capture sinks and app-specific adapters.
 */
export const PIXEL_ANALYTICS_EXTRA_PROVIDERS = new InjectionToken<
  readonly PixelAnalyticsProvider[]
>('PIXEL_ANALYTICS_EXTRA_PROVIDERS', {
  factory: () => [],
});

/**
 * Provider list suitable for application `providers` **or** example component injectors.
 * Prefer {@link providePixelAnalytics} at the application root.
 */
export function createPixelAnalyticsProviders(config: PixelAnalyticsConfig): Provider[] {
  const resolved = resolvePixelAnalyticsConfig(config);
  const registry = new PixelAnalyticsRegistry();
  if (config.events?.length) {
    registry.register(config.events);
  }
  const providers: Provider[] = [
    { provide: PIXEL_ANALYTICS_CONFIG, useValue: config },
    { provide: PIXEL_ANALYTICS_RESOLVED_CONFIG, useValue: resolved },
    { provide: PIXEL_ANALYTICS_REGISTRY, useValue: registry },
  ];

  if (config.http) {
    providers.push({ provide: PIXEL_ANALYTICS_HTTP_CONFIG, useValue: config.http });
    providers.push(PixelAnalyticsHttpProvider);
    providers.push({
      provide: PIXEL_ANALYTICS_PROVIDERS,
      useFactory: (
        httpProvider: PixelAnalyticsHttpProvider,
        extra: readonly PixelAnalyticsProvider[] | null,
      ) => {
        const list: PixelAnalyticsProvider[] = [];
        if (resolved.debug) {
          list.push(new PixelAnalyticsConsoleProvider());
        }
        list.push(httpProvider);
        list.push(...(extra ?? []));
        return list;
      },
      deps: [PixelAnalyticsHttpProvider, [new Optional(), PIXEL_ANALYTICS_EXTRA_PROVIDERS]],
    });
  } else {
    providers.push({
      provide: PIXEL_ANALYTICS_PROVIDERS,
      useFactory: (extra: readonly PixelAnalyticsProvider[] | null) => {
        const list: PixelAnalyticsProvider[] = [];
        if (resolved.debug) {
          list.push(new PixelAnalyticsConsoleProvider());
        }
        list.push(...(extra ?? []));
        if (list.length === 0) {
          list.push(new PixelAnalyticsNoopProvider());
        }
        return list;
      },
      deps: [[new Optional(), PIXEL_ANALYTICS_EXTRA_PROVIDERS]],
    });
  }

  providers.push(
    PixelAnalyticsIdentityService,
    PixelAnalyticsContextService,
    PixelAnalyticsInteractionService,
    PixelAnalyticsConsentService,
    PixelAnalyticsService,
  );

  return providers;
}

/**
 * Registers Pixel Analytics with HTTP-first enterprise delivery.
 *
 * Requires `provideHttpClient()` when `config.http.endpoint` is set.
 *
 * @example
 * ```ts
 * providePixelAnalytics({
 *   application: { id: 'platform-ui', version: '1.0.0', environment: 'production' },
 *   http: { endpoint: '/api/analytics/events' },
 *   consent: { required: true },
 *   debug: !environment.production,
 * })
 * ```
 */
export function providePixelAnalytics(config: PixelAnalyticsConfig): EnvironmentProviders {
  return makeEnvironmentProviders(createPixelAnalyticsProviders(config));
}
