import type { PixelNotificationCreate } from './pixel-notification.types';

/** Permission / environment state for Web Push (before or after a subscription exists). */
export type PixelPushPermissionState =
  | 'unsupported'
  | 'insecure-context'
  | 'default'
  | 'granted'
  | 'denied';

/** High-level lifecycle status for {@link PixelPushNotificationService}. */
export type PixelPushStatus = 'idle' | 'busy' | 'subscribed' | 'error';

/**
 * Serializable Web Push subscription DTO for app backends.
 * Apps may extend with `userId` / `tenantId` outside this shape.
 */
export interface PixelPushSubscriptionRecord {
  readonly endpoint: string;
  readonly expirationTime: number | null;
  readonly keys: {
    readonly p256dh: string;
    readonly auth: string;
  };
  readonly userAgent?: string;
  readonly deviceLabel?: string;
  /** ISO-8601 timestamp when the client created this snapshot. */
  readonly createdAt: string;
}

/**
 * Normalized push body. Service Workers should `JSON.parse` the push text into this shape.
 * `notification` feeds the in-app inbox bridge; `push` tunes OS chrome.
 */
export interface PixelPushPayload {
  readonly notification: PixelNotificationCreate;
  readonly push?: PixelPushPresentationOptions;
}

/** OS notification presentation hints (best-effort across browsers). */
export interface PixelPushPresentationOptions {
  readonly tag?: string;
  readonly requireInteraction?: boolean;
  /**
   * Best-effort only. Chrome requires `userVisibleOnly: true` subscriptions, so silent
   * background sync must not be a product dependency.
   */
  readonly silent?: boolean;
  readonly image?: string;
  readonly badge?: string;
  readonly renotify?: boolean;
  readonly timestamp?: number;
}

/**
 * Service Worker ↔ client message protocol.
 * Keep payloads JSON-serializable (no handlers / Element refs).
 */
export type PixelPushClientMessageType =
  | 'pixel-push-received'
  | 'pixel-push-click'
  | 'pixel-push-close'
  | 'pixel-push-subscribe-result';

export interface PixelPushClientMessageBase {
  readonly type: PixelPushClientMessageType;
}

export interface PixelPushReceivedMessage extends PixelPushClientMessageBase {
  readonly type: 'pixel-push-received';
  readonly payload: PixelPushPayload;
}

export interface PixelPushClickMessage extends PixelPushClientMessageBase {
  readonly type: 'pixel-push-click';
  readonly notificationId?: string;
  readonly actionId?: string;
  readonly nav?: string | Readonly<Record<string, unknown>>;
  readonly payload?: PixelPushPayload;
}

export interface PixelPushCloseMessage extends PixelPushClientMessageBase {
  readonly type: 'pixel-push-close';
  readonly notificationId?: string;
  readonly tag?: string;
}

export interface PixelPushSubscribeResultMessage extends PixelPushClientMessageBase {
  readonly type: 'pixel-push-subscribe-result';
  readonly ok: boolean;
  readonly subscription?: PixelPushSubscriptionRecord | null;
  readonly error?: string;
}

export type PixelPushClientMessage =
  | PixelPushReceivedMessage
  | PixelPushClickMessage
  | PixelPushCloseMessage
  | PixelPushSubscribeResultMessage;

/** Result of {@link PixelPushNotificationService.enable} / {@link PixelPushNotificationService.disable}. */
export interface PixelPushOperationResult {
  readonly ok: boolean;
  readonly permission: PixelPushPermissionState;
  readonly subscription: PixelPushSubscriptionRecord | null;
  readonly error?: string;
}
