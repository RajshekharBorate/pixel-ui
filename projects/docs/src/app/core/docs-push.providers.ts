import type { EnvironmentProviders, Provider } from '@angular/core';
import {
  PixelPushMemorySubscriptionAdapter,
  providePixelPushNotifications,
  type PixelPushServiceWorkerAdapter,
} from 'pixel-ui';

/**
 * In-memory PushManager so Enable works in docs without a push gateway / VAPID.
 * OS toasts still use the real `/pixel-push-sw.js` registration.
 */
function createDocsPushServiceWorkerAdapter(): PixelPushServiceWorkerAdapter {
  let subscription: PushSubscription | null = null;
  const registration = {
    pushManager: {
      getSubscription: async () => subscription,
      subscribe: async () => {
        subscription = {
          endpoint: 'https://docs.pixel-ui.local/push/demo',
          expirationTime: null,
          options: { userVisibleOnly: true, applicationServerKey: null },
          getKey: () => null,
          toJSON: () => ({
            endpoint: 'https://docs.pixel-ui.local/push/demo',
            expirationTime: null,
            keys: { p256dh: 'docs-p256dh', auth: 'docs-auth' },
          }),
          unsubscribe: async () => {
            subscription = null;
            return true;
          },
        } as unknown as PushSubscription;
        return subscription;
      },
    },
  } as unknown as ServiceWorkerRegistration;

  return {
    getRegistration: async () => registration,
  };
}

/**
 * App-level push DI so the SW → bridge listener survives leaving the notification
 * examples page (component-scoped providers were destroyed on navigate away).
 */
export function provideDocsPixelPushNotifications(): Array<Provider | EnvironmentProviders> {
  return providePixelPushNotifications({
    subscription: new PixelPushMemorySubscriptionAdapter(),
    serviceWorker: createDocsPushServiceWorkerAdapter(),
  });
}
