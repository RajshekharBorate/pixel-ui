import type {
  PixelNotification,
  PixelNotificationAction,
  PixelNotificationChannel,
  PixelNotificationCreate,
  PixelNotificationUpdate,
} from './pixel-notification.types';

/** Serializable action payload — handler functions are never persisted. */
export type PixelNotificationPersistedAction = Omit<PixelNotificationAction, 'handler'>;

/** Serializable notification record suitable for persistence adapters. */
export type PixelNotificationPersistedRecord = Omit<PixelNotification, 'actions'> & {
  readonly actions: readonly PixelNotificationPersistedAction[];
};

/**
 * Pluggable persistence for durable inbox state. Implementations may use IndexedDB,
 * localStorage, or a remote API. The core never assumes a browser storage engine.
 */
export interface PixelNotificationPersistenceAdapter {
  load():
    | Promise<readonly PixelNotificationPersistedRecord[]>
    | readonly PixelNotificationPersistedRecord[];
  save(
    records: readonly PixelNotificationPersistedRecord[],
  ): Promise<void> | void;
  clear?(): Promise<void> | void;
}

export type PixelNotificationTransportEventType =
  | 'upsert'
  | 'update'
  | 'remove'
  | 'read'
  | 'unread'
  | 'archive'
  | 'restore'
  | 'mark-all-read'
  | 'snapshot'
  | 'ack'
  | 'conflict';

/**
 * Normalized inbound transport envelope. Applications own WebSocket/SSE/polling
 * sockets and map backend payloads into this shape before forwarding.
 */
export interface PixelNotificationTransportEvent {
  readonly type: PixelNotificationTransportEventType;
  /** Monotonic server sequence used for reconnect replay and out-of-order rejection. */
  readonly sequence?: number;
  readonly id?: string;
  readonly notification?: PixelNotificationCreate;
  readonly notifications?: readonly PixelNotificationCreate[];
  readonly patch?: PixelNotificationUpdate;
  readonly clientMutationId?: string;
}

export type PixelNotificationClientMutationType =
  | 'publish'
  | 'update'
  | 'read'
  | 'unread'
  | 'archive'
  | 'restore'
  | 'remove'
  | 'mark-all-read'
  | 'clear';

/** Optimistic outbound mutation the sync layer may forward through a transport. */
export interface PixelNotificationClientMutation {
  readonly clientMutationId: string;
  readonly type: PixelNotificationClientMutationType;
  readonly id?: string;
  readonly notification?: PixelNotificationCreate;
  readonly patch?: PixelNotificationUpdate;
  readonly lastKnownUpdatedAt?: number;
}

/**
 * Application-owned transport contract. Connect returns a disconnect function.
 * Auth, reconnect, heartbeats, and protocol framing stay outside pixel-ui.
 */
export interface PixelNotificationTransportAdapter {
  connect(
    handler: (event: PixelNotificationTransportEvent) => void,
  ): () => void;
  send?(mutation: PixelNotificationClientMutation): void | Promise<void>;
  /**
   * Optional replay request after reconnect. When omitted, the sync layer still
   * applies later events and may hydrate from persistence instead.
   */
  requestReplay?(afterSequence: number): void | Promise<void>;
}

export interface PixelNotificationPreferences {
  readonly mutedCategories: readonly string[];
  readonly disabledChannels: readonly PixelNotificationChannel[];
  readonly quietHoursEnabled: boolean;
  /** Local time `HH:mm` inclusive start. */
  readonly quietHoursStart: string;
  /** Local time `HH:mm` exclusive end (supports overnight windows). */
  readonly quietHoursEnd: string;
}

export const PIXEL_NOTIFICATION_DEFAULT_PREFERENCES: PixelNotificationPreferences = {
  mutedCategories: [],
  disabledChannels: [],
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export interface PixelNotificationAnalyticsEvent {
  readonly name:
    | 'published'
    | 'updated'
    | 'read'
    | 'unread'
    | 'archived'
    | 'restored'
    | 'removed'
    | 'cleared'
    | 'action'
    | 'sync_connected'
    | 'sync_disconnected'
    | 'sync_conflict'
    | 'sync_replay'
    | 'preference_changed';
  readonly notification?: PixelNotification | null;
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface PixelNotificationAnalytics {
  track(event: PixelNotificationAnalyticsEvent): void;
}

export type PixelNotificationGroupBy = 'day' | 'category' | 'source';

export interface PixelNotificationGroup {
  readonly key: string;
  readonly label: string;
  readonly notifications: readonly PixelNotification[];
}

/** In-memory persistence useful for tests and ephemeral sessions. */
export class PixelNotificationMemoryPersistenceAdapter
  implements PixelNotificationPersistenceAdapter
{
  private records: readonly PixelNotificationPersistedRecord[] = [];

  load(): readonly PixelNotificationPersistedRecord[] {
    return this.records;
  }

  save(records: readonly PixelNotificationPersistedRecord[]): void {
    this.records = records.map((record) => ({
      ...record,
      actions: [...record.actions],
      data: { ...record.data },
      channels: [...record.channels],
    }));
  }

  clear(): void {
    this.records = [];
  }
}

export function toPersistedNotification(
  notification: PixelNotification,
): PixelNotificationPersistedRecord {
  return {
    ...notification,
    actions: notification.actions.map(({ handler: _handler, ...action }) => action),
  };
}

export function fromPersistedNotification(
  record: PixelNotificationPersistedRecord,
): PixelNotification {
  return {
    ...record,
    actions: [...record.actions],
  };
}

/** Unread records that need a user decision (inline actions or high/critical priority). */
export function isActionRequiredNotification(notification: PixelNotification): boolean {
  if (notification.readAt !== null || notification.archivedAt !== null) {
    return false;
  }
  if (
    notification.state === 'completed' ||
    notification.state === 'failed' ||
    notification.state === 'loading'
  ) {
    return false;
  }
  return (
    notification.actions.length > 0 ||
    notification.priority === 'high' ||
    notification.priority === 'critical'
  );
}

/**
 * Display label for a stored category slug/id. Title-cases words and treats `_` / `-` as
 * spaces (`jobs` → `Jobs`, `action-required` → `Action Required`). Filtering still uses the
 * original stored value.
 */
export function formatNotificationCategoryLabel(category: string): string {
  const normalized = category.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!normalized) {
    return '';
  }
  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Inbox display order: newer calendar days first; within a day, unread before read,
 * then newest `createdAt`. Used by the panel, `inbox` projection, and day grouping.
 * Reading a record does not move it across days or above newer unread siblings.
 */
export function sortNotificationsForDisplay(
  notifications: readonly PixelNotification[],
): PixelNotification[] {
  return [...notifications].sort(compareNotificationsForDisplay);
}

/**
 * Groups notifications for activity feeds and full-page centers. Day keys use the
 * local calendar date (`YYYY-MM-DD`); empty category/source fall back to stable labels.
 * Day groups are emitted newest-first (Today → Yesterday → older). Within each day,
 * items are unread-first then `createdAt` descending.
 */
export function groupNotifications(
  notifications: readonly PixelNotification[],
  by: PixelNotificationGroupBy = 'day',
): readonly PixelNotificationGroup[] {
  const groups = new Map<string, PixelNotification[]>();

  for (const notification of notifications) {
    const key =
      by === 'day'
        ? toDayKey(notification.createdAt)
        : by === 'category'
          ? notification.category.trim() || 'uncategorized'
          : notification.source.trim() || 'unknown';
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(notification);
    } else {
      groups.set(key, [notification]);
    }
  }

  const mapped = [...groups.entries()].map(([key, items]) => ({
    key,
    label:
      by === 'day'
        ? formatDayLabel(key)
        : by === 'category'
          ? key === 'uncategorized'
            ? 'Uncategorized'
            : formatNotificationCategoryLabel(key)
          : key === 'unknown'
            ? 'Unknown source'
            : key,
    notifications: by === 'day' ? sortNotificationsForDisplay(items) : items,
  }));

  if (by === 'day') {
    return mapped.sort((left, right) => right.key.localeCompare(left.key));
  }
  return mapped;
}

function compareNotificationsForDisplay(
  left: PixelNotification,
  right: PixelNotification,
): number {
  const dayCmp = toDayKey(right.createdAt).localeCompare(toDayKey(left.createdAt));
  if (dayCmp !== 0) {
    return dayCmp;
  }
  const unreadCmp = Number(right.readAt === null) - Number(left.readAt === null);
  if (unreadCmp !== 0) {
    return unreadCmp;
  }
  return right.createdAt - left.createdAt;
}

/** True when local clock falls inside the configured quiet-hours window. */
export function isWithinQuietHours(
  preferences: PixelNotificationPreferences,
  now = new Date(),
): boolean {
  if (!preferences.quietHoursEnabled) {
    return false;
  }
  const start = parseTimeMinutes(preferences.quietHoursStart);
  const end = parseTimeMinutes(preferences.quietHoursEnd);
  if (start === null || end === null) {
    return false;
  }
  const current = now.getHours() * 60 + now.getMinutes();
  if (start === end) {
    return true;
  }
  return start < end ? current >= start && current < end : current >= start || current < end;
}

function toDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(dayKey: string, now = new Date()): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  if (!year || !month || !day) {
    return dayKey;
  }
  const todayKey = toDayKey(now.getTime());
  if (dayKey === todayKey) {
    return 'Today';
  }
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey === toDayKey(yesterday.getTime())) {
    return 'Yesterday';
  }
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function parseTimeMinutes(value: string): number | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}
