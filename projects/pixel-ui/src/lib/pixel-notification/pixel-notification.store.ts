import { Injectable, computed, inject, signal } from '@angular/core';
import { PIXEL_NOTIFICATION_CONFIG } from './pixel-notification.config';
import type { PixelNotification, PixelNotificationUpdate } from './pixel-notification.types';

@Injectable({ providedIn: 'root' })
export class PixelNotificationStore {
  private readonly config = inject(PIXEL_NOTIFICATION_CONFIG);
  private readonly records = signal<readonly PixelNotification[]>([]);

  readonly notifications = this.records.asReadonly();

  readonly inbox = computed(() =>
    this.records().filter(
      (notification) =>
        notification.archivedAt === null && notification.channels.includes('inbox'),
    ),
  );

  readonly unread = computed(() =>
    this.inbox().filter((notification) => notification.readAt === null),
  );

  readonly unreadCount = computed(() => this.unread().length);

  readonly archived = computed(() =>
    this.records().filter((notification) => notification.archivedAt !== null),
  );

  readonly countsByCategory = computed<ReadonlyMap<string, number>>(() => {
    const counts = new Map<string, number>();
    for (const notification of this.inbox()) {
      const category = notification.category || 'uncategorized';
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return counts;
  });

  get(id: string): PixelNotification | null {
    return this.records().find((notification) => notification.id === id) ?? null;
  }

  findByDedupeKey(dedupeKey: string): PixelNotification | null {
    if (!dedupeKey) {
      return null;
    }
    return (
      this.records().find(
        (notification) =>
          notification.dedupeKey === dedupeKey && notification.archivedAt === null,
      ) ?? null
    );
  }

  upsert(notification: PixelNotification): PixelNotification {
    this.records.update((records) => {
      const withoutCurrent = records.filter((current) => current.id !== notification.id);
      const maxItems = Math.max(1, this.config.maxItems);
      return [notification, ...withoutCurrent]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, maxItems);
    });
    return notification;
  }

  patch(
    id: string,
    patch: PixelNotificationUpdate & {
      readonly updatedAt?: number;
      readonly readAt?: number | null;
      readonly archivedAt?: number | null;
      readonly occurrences?: number;
    },
  ): PixelNotification | null {
    const current = this.get(id);
    if (!current) {
      return null;
    }
    const updated: PixelNotification = {
      ...current,
      ...patch,
      updatedAt: patch.updatedAt ?? Date.now(),
      expiresAt:
        patch.expiresAt === undefined
          ? current.expiresAt
          : normalizeOptionalTimestamp(patch.expiresAt),
      progress:
        patch.progress === undefined ? current.progress : normalizeProgress(patch.progress),
      actions: patch.actions ?? current.actions,
      channels: patch.channels ?? current.channels,
      data: patch.data ?? current.data,
    };
    return this.upsert(updated);
  }

  markRead(id: string, readAt = Date.now()): PixelNotification | null {
    return this.patch(id, { readAt });
  }

  markUnread(id: string): PixelNotification | null {
    return this.patch(id, { readAt: null });
  }

  markAllRead(readAt = Date.now()): void {
    this.records.update((records) =>
      records.map((notification) =>
        notification.archivedAt === null &&
        notification.channels.includes('inbox') &&
        notification.readAt === null
          ? { ...notification, readAt, updatedAt: readAt }
          : notification,
      ),
    );
  }

  archive(id: string, archivedAt = Date.now()): PixelNotification | null {
    return this.patch(id, { archivedAt });
  }

  restore(id: string): PixelNotification | null {
    return this.patch(id, { archivedAt: null });
  }

  remove(id: string): PixelNotification | null {
    const current = this.get(id);
    if (!current) {
      return null;
    }
    this.records.update((records) =>
      records.filter((notification) => notification.id !== id),
    );
    return current;
  }

  clear(): void {
    this.records.set([]);
  }

  /** Replace the entire durable set (hydration / snapshot). */
  replaceAll(notifications: readonly PixelNotification[]): void {
    const maxItems = Math.max(1, this.config.maxItems);
    this.records.set(
      [...notifications]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, maxItems),
    );
  }

  pruneExpired(now = Date.now()): readonly PixelNotification[] {
    const expired = this.records().filter(
      (notification) =>
        notification.expiresAt !== null && notification.expiresAt <= now,
    );
    if (expired.length > 0) {
      const ids = new Set(expired.map((notification) => notification.id));
      this.records.update((records) =>
        records.filter((notification) => !ids.has(notification.id)),
      );
    }
    return expired;
  }
}

function normalizeOptionalTimestamp(value: number | string | Date | null): number | null {
  if (value === null) {
    return null;
  }
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function normalizeProgress(value: number | null): number | null {
  return value === null ? null : Math.max(0, Math.min(100, value));
}
