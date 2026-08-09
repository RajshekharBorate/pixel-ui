/**
 * Reference Service Worker helpers for Web Push.
 *
 * Apps own the SW file. Import these pure helpers into a bundled worker, or copy the
 * protocol from `projects/docs/public/pixel-push-sw.js`. Do **not** register this module
 * as the worker entry from Angular alone — scope / `ngsw` conflicts are app concerns.
 */

import type { PixelNotificationPreferences } from './pixel-notification.adapters';
import { isWithinQuietHours } from './pixel-notification.adapters';
import type {
  PixelPushClientMessage,
  PixelPushPayload,
  PixelPushPresentationOptions,
  PixelPushVisualConfig,
} from './pixel-notification-push.types';
import { parsePixelPushPayload } from './pixel-notification-push.adapters';
import {
  DEFAULT_PIXEL_PUSH_VISUAL_CONFIG,
  resolveOsNotificationVisuals,
} from './pixel-notification-push.visuals';

/** localStorage key written by the page so the SW can honor quiet hours / mutes offline. */
export const PIXEL_PUSH_PREFS_CACHE_KEY = 'pixel-push-prefs-v1';

export interface PixelPushPrefsCache extends Pick<
  PixelNotificationPreferences,
  | 'mutedCategories'
  | 'disabledChannels'
  | 'quietHoursEnabled'
  | 'quietHoursStart'
  | 'quietHoursEnd'
> {
  readonly updatedAt: number;
}

/** Snapshot preferences for the Service Worker (SSR-safe no-op). */
export function writePixelPushPrefsCache(
  preferences: PixelNotificationPreferences,
  storage: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null,
): void {
  if (!storage) {
    return;
  }
  const cache: PixelPushPrefsCache = {
    mutedCategories: [...preferences.mutedCategories],
    disabledChannels: [...preferences.disabledChannels],
    quietHoursEnabled: preferences.quietHoursEnabled,
    quietHoursStart: preferences.quietHoursStart,
    quietHoursEnd: preferences.quietHoursEnd,
    updatedAt: Date.now(),
  };
  storage.setItem(PIXEL_PUSH_PREFS_CACHE_KEY, JSON.stringify(cache));
}

export function readPixelPushPrefsCache(
  storage: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null,
): PixelPushPrefsCache | null {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(PIXEL_PUSH_PREFS_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PixelPushPrefsCache;
  } catch {
    return null;
  }
}

/** Whether the SW should call `showNotification` for this payload. */
export function shouldShowOsNotification(
  payload: PixelPushPayload,
  preferences: PixelPushPrefsCache | PixelNotificationPreferences | null,
  now = new Date(),
): boolean {
  if (!preferences) {
    return true;
  }
  if (preferences.disabledChannels.includes('push')) {
    return false;
  }
  const category = payload.notification.category?.trim() ?? '';
  if (category && preferences.mutedCategories.includes(category)) {
    return false;
  }
  if (isWithinQuietHours(preferences as PixelNotificationPreferences, now)) {
    return false;
  }
  return true;
}

/** Maps a library payload to `ServiceWorkerRegistration.showNotification` options. */
export function buildOsNotificationOptions(
  payload: PixelPushPayload,
  visualConfig: PixelPushVisualConfig = DEFAULT_PIXEL_PUSH_VISUAL_CONFIG,
): { readonly title: string; readonly options: NotificationOptions } {
  const { notification, push } = payload;
  const tag =
    push?.tag ??
    (notification.dedupeKey?.trim() || notification.id?.trim() || undefined);
  const actions = (notification.actions ?? []).slice(0, 2).map((action) => ({
    action: action.id,
    title: action.label,
  }));
  const visuals = resolveOsNotificationVisuals(payload, visualConfig);
  const options: NotificationOptions & PixelPushPresentationOptions = {
    body: notification.message ?? '',
    tag,
    renotify: push?.renotify ?? !!tag,
    requireInteraction:
      push?.requireInteraction ?? notification.priority === 'critical',
    silent: push?.silent,
    icon: visuals.icon,
    image: visuals.image,
    badge: visuals.badge,
    timestamp: push?.timestamp,
    data: {
      pixelPush: payload,
      notificationId: notification.id,
      nav: notification.data?.['nav'] ?? notification.actions?.[0]?.nav,
    },
    ...(actions.length > 0 ? { actions } : {}),
  };
  return { title: notification.title, options };
}

export function parsePushEventData(data: unknown): PixelPushPayload | null {
  if (data && typeof data === 'object') {
    const pushData = data as { json?: () => unknown; text?: () => string };
    if (typeof pushData.json === 'function') {
      try {
        return parsePixelPushPayload(pushData.json());
      } catch {
        /* fall through */
      }
    }
    if (typeof pushData.text === 'function') {
      try {
        return parsePixelPushPayload(pushData.text());
      } catch {
        return null;
      }
    }
  }
  return parsePixelPushPayload(data);
}

/** Minimal client list surface used by the reference SW helpers. */
export interface PixelPushClientsLike {
  matchAll(options?: {
    type?: 'window' | 'worker' | 'sharedworker' | 'all';
    includeUncontrolled?: boolean;
  }): Promise<readonly PixelPushWindowClientLike[]>;
  openWindow?(url: string): Promise<PixelPushWindowClientLike | null>;
}

export interface PixelPushWindowClientLike {
  focus(): Promise<PixelPushWindowClientLike>;
  postMessage(message: unknown): void;
}

/** Post a typed protocol message to all window clients. */
export async function broadcastPixelPushMessage(
  clientsApi: PixelPushClientsLike,
  message: PixelPushClientMessage,
): Promise<void> {
  const windows = await clientsApi.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windows) {
    client.postMessage(message);
  }
}

/**
 * Focus an existing client or open `url`. Returns the focused/opened client when available.
 */
export async function focusOrOpenClient(
  clientsApi: PixelPushClientsLike,
  url?: string,
): Promise<PixelPushWindowClientLike | null> {
  const windows = await clientsApi.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windows) {
    return client.focus();
  }
  if (url && clientsApi.openWindow) {
    return clientsApi.openWindow(url);
  }
  return null;
}

/** Type guard for inbound SW → page messages. */
export function isPixelPushClientMessage(value: unknown): value is PixelPushClientMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const type = (value as { type?: unknown }).type;
  return (
    type === 'pixel-push-received' ||
    type === 'pixel-push-click' ||
    type === 'pixel-push-close' ||
    type === 'pixel-push-subscribe-result'
  );
}
