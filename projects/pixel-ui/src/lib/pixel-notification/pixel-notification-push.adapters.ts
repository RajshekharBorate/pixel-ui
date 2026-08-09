import type { PixelNotificationCreate } from './pixel-notification.types';
import type {
  PixelPushPayload,
  PixelPushPresentationOptions,
  PixelPushSubscriptionRecord,
} from './pixel-notification-push.types';

/**
 * App-owned persistence for Web Push subscriptions. Auth, tenant scoping, and HTTP stay here.
 */
export interface PixelPushSubscriptionAdapter {
  /** VAPID application server key (URL-safe base64). */
  getVapidPublicKey(): string | Promise<string>;
  saveSubscription(subscription: PixelPushSubscriptionRecord): void | Promise<void>;
  deleteSubscription(subscription: PixelPushSubscriptionRecord): void | Promise<void>;
}

/**
 * Optional override for Service Worker lookup. Defaults to `navigator.serviceWorker`.
 */
export interface PixelPushServiceWorkerAdapter {
  getRegistration(): Promise<ServiceWorkerRegistration | null>;
}

/** In-memory subscription adapter for unit tests and local demos. */
export class PixelPushMemorySubscriptionAdapter implements PixelPushSubscriptionAdapter {
  private readonly vapidPublicKey: string;
  private saved: PixelPushSubscriptionRecord | null = null;

  constructor(vapidPublicKey = 'AQID') {
    this.vapidPublicKey = vapidPublicKey;
  }

  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  saveSubscription(subscription: PixelPushSubscriptionRecord): void {
    this.saved = { ...subscription, keys: { ...subscription.keys } };
  }

  deleteSubscription(_subscription: PixelPushSubscriptionRecord): void {
    this.saved = null;
  }

  /** Test helper — last subscription posted to the adapter. */
  getSaved(): PixelPushSubscriptionRecord | null {
    return this.saved;
  }
}

/**
 * Decodes a URL-safe base64 VAPID public key into an `Uint8Array` for `PushManager.subscribe`.
 */
export function decodeVapidPublicKey(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = globalThis.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

/** Maps a browser `PushSubscription` to the serializable library DTO. */
export function toPushSubscriptionRecord(
  subscription: PushSubscription,
  options?: { readonly deviceLabel?: string; readonly now?: Date },
): PixelPushSubscriptionRecord {
  const json = subscription.toJSON();
  const keys = json.keys;
  const p256dh = keys?.['p256dh'];
  const auth = keys?.['auth'];
  if (!json.endpoint || !p256dh || !auth) {
    throw new Error('Push subscription is missing endpoint or keys.');
  }
  const now = options?.now ?? new Date();
  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: { p256dh, auth },
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    deviceLabel: options?.deviceLabel,
    createdAt: now.toISOString(),
  };
}

/** Best-effort parse of a push event payload string / object into `PixelPushPayload`. */
export function parsePixelPushPayload(data: unknown): PixelPushPayload | null {
  let value = data;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  const nested = record['notification'];
  if (nested && typeof nested === 'object' && typeof (nested as { title?: unknown }).title === 'string') {
    return {
      notification: nested as PixelNotificationCreate,
      push: isPresentationOptions(record['push']) ? record['push'] : undefined,
    };
  }
  // Bare PixelNotificationCreate at the root for simpler gateways.
  if (typeof record['title'] === 'string') {
    return {
      notification: record as unknown as PixelNotificationCreate,
      push: isPresentationOptions(record['push']) ? record['push'] : undefined,
    };
  }
  return null;
}

function isPresentationOptions(value: unknown): value is PixelPushPresentationOptions {
  return !!value && typeof value === 'object';
}
