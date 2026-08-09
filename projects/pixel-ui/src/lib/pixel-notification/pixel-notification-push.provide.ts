import type { Provider } from '@angular/core';
import { PixelPushNotificationBridge } from './pixel-notification-push.bridge';
import {
  PIXEL_PUSH_SERVICE_WORKER_ADAPTER,
  PIXEL_PUSH_SUBSCRIPTION_ADAPTER,
  PIXEL_PUSH_VISUAL_CONFIG,
  type ProvidePixelPushNotificationsOptions,
} from './pixel-notification-push.config';
import { PixelPushNotificationService } from './pixel-notification-push.service';

export type { ProvidePixelPushNotificationsOptions } from './pixel-notification-push.config';

/**
 * Registers Web Push adapters and the push services. Required — services are not
 * `providedIn: 'root'`, so app- or component-level providers are visible to injectors
 * (including docs examples).
 */
export function providePixelPushNotifications(
  options: ProvidePixelPushNotificationsOptions,
): Provider[] {
  const providers: Provider[] = [
    { provide: PIXEL_PUSH_SUBSCRIPTION_ADAPTER, useValue: options.subscription },
    PixelPushNotificationBridge,
    PixelPushNotificationService,
  ];
  if (options.serviceWorker) {
    providers.push({
      provide: PIXEL_PUSH_SERVICE_WORKER_ADAPTER,
      useValue: options.serviceWorker,
    });
  }
  if (options.visual) {
    providers.push({ provide: PIXEL_PUSH_VISUAL_CONFIG, useValue: options.visual });
  }
  return providers;
}
