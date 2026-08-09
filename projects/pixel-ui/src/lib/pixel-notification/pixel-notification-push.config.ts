import { InjectionToken } from '@angular/core';
import type {
  PixelPushServiceWorkerAdapter,
  PixelPushSubscriptionAdapter,
} from './pixel-notification-push.adapters';
import type { PixelPushVisualConfig } from './pixel-notification-push.types';

export const PIXEL_PUSH_SUBSCRIPTION_ADAPTER =
  new InjectionToken<PixelPushSubscriptionAdapter>('PIXEL_PUSH_SUBSCRIPTION_ADAPTER');

export const PIXEL_PUSH_SERVICE_WORKER_ADAPTER =
  new InjectionToken<PixelPushServiceWorkerAdapter>('PIXEL_PUSH_SERVICE_WORKER_ADAPTER');

export const PIXEL_PUSH_VISUAL_CONFIG = new InjectionToken<PixelPushVisualConfig>(
  'PIXEL_PUSH_VISUAL_CONFIG',
);

export interface ProvidePixelPushNotificationsOptions {
  readonly subscription: PixelPushSubscriptionAdapter;
  readonly serviceWorker?: PixelPushServiceWorkerAdapter;
  /** Defaults for Material glyph URLs / branded OS icon. */
  readonly visual?: PixelPushVisualConfig;
}
