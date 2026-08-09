import { InjectionToken, type Provider } from '@angular/core';
import type {
  PixelPushServiceWorkerAdapter,
  PixelPushSubscriptionAdapter,
} from './pixel-notification-push.adapters';

export const PIXEL_PUSH_SUBSCRIPTION_ADAPTER =
  new InjectionToken<PixelPushSubscriptionAdapter>('PIXEL_PUSH_SUBSCRIPTION_ADAPTER');

export const PIXEL_PUSH_SERVICE_WORKER_ADAPTER =
  new InjectionToken<PixelPushServiceWorkerAdapter>('PIXEL_PUSH_SERVICE_WORKER_ADAPTER');

export interface ProvidePixelPushNotificationsOptions {
  readonly subscription: PixelPushSubscriptionAdapter;
  readonly serviceWorker?: PixelPushServiceWorkerAdapter;
}
