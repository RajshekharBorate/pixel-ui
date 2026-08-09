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

/**
 * How to pick the OS notification leading `icon`.
 * - `auto` — push.icon → avatar imageSrc → URL icon → Material ligature/severity → defaultIconUrl
 * - `avatar` — prefer `notification.imageSrc` as OS `icon`
 * - `severity` — Material Symbols SVG from severity / ligature
 * - `icon` — `notification.icon` as URL or Material ligature
 * - `none` — omit OS `icon`
 */
export type PixelPushLeadingVisual = 'auto' | 'avatar' | 'severity' | 'icon' | 'none';

/** OS notification presentation hints (best-effort across browsers). */
export interface PixelPushPresentationOptions {
  readonly tag?: string;
  readonly requireInteraction?: boolean;
  /**
   * Best-effort only. Chrome requires `userVisibleOnly: true` subscriptions, so silent
   * background sync must not be a product dependency.
   */
  readonly silent?: boolean;
  /**
   * Absolute URL for the OS leading icon. Wins over avatar / Material resolution when set.
   * Material font ligatures are not valid here — use {@link resolveOsNotificationVisuals}.
   */
  readonly icon?: string;
  /** Large / hero media URL (not avatars — put avatars in `notification.imageSrc`). */
  readonly image?: string;
  readonly badge?: string;
  readonly renotify?: boolean;
  readonly timestamp?: number;
  /** Leading visual strategy. @default 'auto' */
  readonly leading?: PixelPushLeadingVisual;
}

/**
 * App-level defaults for resolving OS notification visuals (Material CDN, branded icon).
 * Passed into {@link buildOsNotificationOptions} / Service Worker helpers — not DI-only.
 */
export interface PixelPushVisualConfig {
  /**
   * Base URL for Material Symbols Outlined SVGs (no trailing slash).
   * @default https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined
   */
  readonly materialIconBaseUrl?: string;
  /** Pixel size segment in the Material SVG path. @default 48 */
  readonly materialIconSize?: number;
  /** Fallback OS icon when no avatar / Material glyph applies. */
  readonly defaultIconUrl?: string;
  /**
   * When true (default), ligature `notification.icon` and `severity` map to Google-hosted
   * Material Symbols SVG URLs for OS `icon` / optional avatar `badge`.
   */
  readonly useMaterialSeverityIcons?: boolean;
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
