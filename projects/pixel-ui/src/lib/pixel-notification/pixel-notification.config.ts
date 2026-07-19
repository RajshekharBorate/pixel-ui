import { InjectionToken, type Provider } from '@angular/core';
import {
  PIXEL_NOTIFICATION_DEFAULT_PREFERENCES,
  type PixelNotificationAnalytics,
  type PixelNotificationPersistenceAdapter,
  type PixelNotificationPreferences,
  type PixelNotificationTransportAdapter,
} from './pixel-notification.adapters';
import type {
  PixelNotification,
  PixelNotificationChannel,
  PixelNotificationChannelPolicy,
  PixelNotificationConfig,
  PixelNotificationRoute,
} from './pixel-notification.types';

export const PIXEL_NOTIFICATION_DEFAULT_CONFIG: PixelNotificationConfig = {
  maxItems: 500,
  defaultSeverity: 'neutral',
  defaultPriority: 'normal',
  highPriorityToastTimeout: 8000,
  criticalToastPersistent: true,
};

function uniqueChannels(
  channels: readonly PixelNotificationChannel[],
): readonly PixelNotificationChannel[] {
  return [...new Set(channels)];
}

/**
 * Minimal-interruption default: every notification reaches the inbox; only high and critical
 * priority also interrupt through a toast. Explicit channels always win.
 */
export const pixelNotificationDefaultChannelPolicy: PixelNotificationChannelPolicy = (
  notification: PixelNotification,
): PixelNotificationRoute => {
  if (notification.channels.length > 0) {
    return { channels: uniqueChannels(notification.channels) };
  }
  return {
    channels:
      notification.priority === 'high' || notification.priority === 'critical'
        ? ['inbox', 'toast']
        : ['inbox'],
  };
};

export const PIXEL_NOTIFICATION_CONFIG = new InjectionToken<PixelNotificationConfig>(
  'PIXEL_NOTIFICATION_CONFIG',
  {
    providedIn: 'root',
    factory: () => PIXEL_NOTIFICATION_DEFAULT_CONFIG,
  },
);

export const PIXEL_NOTIFICATION_CHANNEL_POLICY =
  new InjectionToken<PixelNotificationChannelPolicy>('PIXEL_NOTIFICATION_CHANNEL_POLICY', {
    providedIn: 'root',
    factory: () => pixelNotificationDefaultChannelPolicy,
  });

export const PIXEL_NOTIFICATION_PERSISTENCE =
  new InjectionToken<PixelNotificationPersistenceAdapter>('PIXEL_NOTIFICATION_PERSISTENCE');

export const PIXEL_NOTIFICATION_TRANSPORT =
  new InjectionToken<PixelNotificationTransportAdapter>('PIXEL_NOTIFICATION_TRANSPORT');

export const PIXEL_NOTIFICATION_ANALYTICS =
  new InjectionToken<PixelNotificationAnalytics>('PIXEL_NOTIFICATION_ANALYTICS');

export const PIXEL_NOTIFICATION_PREFERENCES =
  new InjectionToken<PixelNotificationPreferences>('PIXEL_NOTIFICATION_PREFERENCES', {
    providedIn: 'root',
    factory: () => PIXEL_NOTIFICATION_DEFAULT_PREFERENCES,
  });

export interface ProvidePixelNotificationsOptions {
  readonly config?: Partial<PixelNotificationConfig>;
  readonly policy?: PixelNotificationChannelPolicy;
  readonly persistence?: PixelNotificationPersistenceAdapter;
  readonly transport?: PixelNotificationTransportAdapter;
  readonly analytics?: PixelNotificationAnalytics;
  readonly preferences?: Partial<PixelNotificationPreferences>;
}

/**
 * Configures notification defaults and optionally replaces adapters, policy, preferences,
 * and analytics. The legacy `(config, policy)` call shape remains supported.
 */
export function providePixelNotifications(
  configOrOptions: Partial<PixelNotificationConfig> | ProvidePixelNotificationsOptions = {},
  policy?: PixelNotificationChannelPolicy,
): Provider[] {
  const options = isProvideOptions(configOrOptions)
    ? configOrOptions
    : { config: configOrOptions, policy };

  const providers: Provider[] = [
    {
      provide: PIXEL_NOTIFICATION_CONFIG,
      useValue: { ...PIXEL_NOTIFICATION_DEFAULT_CONFIG, ...(options.config ?? {}) },
    },
  ];

  const resolvedPolicy = options.policy ?? policy;
  if (resolvedPolicy) {
    providers.push({ provide: PIXEL_NOTIFICATION_CHANNEL_POLICY, useValue: resolvedPolicy });
  }
  if (options.persistence) {
    providers.push({ provide: PIXEL_NOTIFICATION_PERSISTENCE, useValue: options.persistence });
  }
  if (options.transport) {
    providers.push({ provide: PIXEL_NOTIFICATION_TRANSPORT, useValue: options.transport });
  }
  if (options.analytics) {
    providers.push({ provide: PIXEL_NOTIFICATION_ANALYTICS, useValue: options.analytics });
  }
  if (options.preferences) {
    providers.push({
      provide: PIXEL_NOTIFICATION_PREFERENCES,
      useValue: {
        ...PIXEL_NOTIFICATION_DEFAULT_PREFERENCES,
        ...options.preferences,
      },
    });
  }

  return providers;
}

function isProvideOptions(
  value: Partial<PixelNotificationConfig> | ProvidePixelNotificationsOptions,
): value is ProvidePixelNotificationsOptions {
  return (
    'config' in value ||
    'policy' in value ||
    'persistence' in value ||
    'transport' in value ||
    'analytics' in value ||
    'preferences' in value
  );
}
