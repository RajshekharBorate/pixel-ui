import {
  Injectable,
  Injector,
  computed,
  inject,
  signal,
} from '@angular/core';
import { PixelDialogService } from '../pixel-dialog/pixel-dialog.service';
import type { PixelDialogRef } from '../pixel-dialog/pixel-dialog-ref';
import { PixelToastService } from '../pixel-toast/pixel-toast.service';
import type {
  PixelToastConfig,
  PixelToastType,
} from '../pixel-toast/pixel-toast.types';
import {
  isWithinQuietHours,
  type PixelNotificationAnalytics,
  type PixelNotificationClientMutationType,
  type PixelNotificationPreferences,
} from './pixel-notification.adapters';
import {
  PIXEL_NOTIFICATION_ANALYTICS,
  PIXEL_NOTIFICATION_CHANNEL_POLICY,
  PIXEL_NOTIFICATION_CONFIG,
  PIXEL_NOTIFICATION_PREFERENCES,
} from './pixel-notification.config';
import PixelNotificationDialogComponent from './pixel-notification-dialog';
import { PixelNotificationStore } from './pixel-notification.store';
import { PixelNotificationSyncService } from './pixel-notification.sync';
import type {
  PixelNotification,
  PixelNotificationActionEvent,
  PixelNotificationChangeEvent,
  PixelNotificationChannel,
  PixelNotificationCreate,
  PixelNotificationSeverity,
  PixelNotificationUpdate,
} from './pixel-notification.types';

let nextNotificationId = 0;

export interface PixelNotificationMutationOptions {
  readonly source?: 'local' | 'remote' | 'hydrate';
}

/**
 * Application-facing notification orchestrator. Normalizes and deduplicates records, maintains
 * durable signal state, applies the injected channel policy and preferences, and delegates toast /
 * dialog presentation to existing pixel primitives.
 */
@Injectable({ providedIn: 'root' })
export class PixelNotificationService {
  private readonly config = inject(PIXEL_NOTIFICATION_CONFIG);
  private readonly channelPolicy = inject(PIXEL_NOTIFICATION_CHANNEL_POLICY);
  private readonly store = inject(PixelNotificationStore);
  private readonly toast = inject(PixelToastService);
  private readonly dialog = inject(PixelDialogService);
  private readonly analytics = inject(PIXEL_NOTIFICATION_ANALYTICS, { optional: true });
  private readonly injector = inject(Injector);
  private readonly toastIds = new Map<string, string>();
  private readonly dialogRefs = new Map<string, PixelDialogRef>();
  private readonly preferencesState = signal<PixelNotificationPreferences>(
    inject(PIXEL_NOTIFICATION_PREFERENCES),
  );

  readonly notifications = this.store.notifications;
  readonly inbox = this.store.inbox;
  readonly unread = this.store.unread;
  readonly unreadCount = this.store.unreadCount;
  readonly archived = this.store.archived;
  readonly countsByCategory = this.store.countsByCategory;
  readonly preferences = this.preferencesState.asReadonly();

  /** Active non-archived records routed to the banner channel after preferences. */
  readonly banners = computed(() =>
    this.store
      .notifications()
      .filter(
        (notification) =>
          notification.archivedAt === null &&
          this.effectiveChannels(notification).includes('banner'),
      ),
  );

  readonly actionEvents = signal<PixelNotificationActionEvent | null>(null);
  readonly changeEvents = signal<PixelNotificationChangeEvent | null>(null);

  /**
   * Replace runtime preferences and reconcile interruptive surfaces.
   * Surfaces that are no longer allowed (muted / quiet hours / disabled channels) are
   * dismissed. Historical records are **not** replayed as new toasts or dialogs — only
   * subsequent `publish` / `update` calls open interruptive UI again.
   */
  setPreferences(preferences: Partial<PixelNotificationPreferences>): void {
    const next = {
      ...this.preferencesState(),
      ...preferences,
      mutedCategories: preferences.mutedCategories
        ? [...preferences.mutedCategories]
        : this.preferencesState().mutedCategories,
      disabledChannels: preferences.disabledChannels
        ? [...preferences.disabledChannels]
        : this.preferencesState().disabledChannels,
    };
    this.preferencesState.set(next);
    for (const notification of this.store.notifications()) {
      this.reconcileInterruptiveDelivery(notification);
    }
    this.track('preference_changed', null, { preferences: next });
  }

  /** Hydrate canonical state without replaying delivery channels or outbound sync. */
  hydrate(records: readonly PixelNotificationCreate[] | readonly PixelNotification[]): void {
    const now = Date.now();
    const normalized = records.map((record) => {
      if (isCanonicalNotification(record)) {
        return record;
      }
      return this.normalize(record, now);
    });
    this.store.replaceAll(normalized);
    for (const notification of this.toastIds.keys()) {
      this.removeToast(notification);
    }
    for (const notification of this.dialogRefs.keys()) {
      this.closeDialog(notification);
    }
  }

  /** Publish one record through normalization, deduplication, storage, and channel delivery. */
  publish(
    draft: PixelNotificationCreate,
    options: PixelNotificationMutationOptions = {},
  ): string {
    this.pruneExpired();
    const now = Date.now();
    const normalized = this.normalize(draft, now);
    const duplicate =
      this.store.findByDedupeKey(normalized.dedupeKey) ??
      (draft.id ? this.store.get(draft.id) : null);
    const source = options.source ?? 'local';

    if (duplicate) {
      const routed = this.route({
        ...duplicate,
        ...normalized,
        id: duplicate.id,
        createdAt: duplicate.createdAt,
        updatedAt: now,
        readAt: null,
        archivedAt: null,
        occurrences: duplicate.occurrences + 1,
      });
      this.store.upsert(routed);
      this.syncDelivery(routed);
      this.emitChange('updated', routed);
      this.track('updated', routed);
      this.emitLocalMutation(source, {
        type: 'publish',
        id: routed.id,
        notification: draft,
        lastKnownUpdatedAt: duplicate.updatedAt,
      });
      return routed.id;
    }

    const notification = this.route(normalized);
    this.store.upsert(notification);
    this.syncDelivery(notification);
    this.emitChange('published', notification);
    this.track('published', notification);
    this.emitLocalMutation(source, {
      type: 'publish',
      id: notification.id,
      notification: draft,
    });
    return notification.id;
  }

  /** Publish a batch in input order and return the resolved ids. */
  publishMany(drafts: readonly PixelNotificationCreate[]): readonly string[] {
    return drafts.map((draft) => this.publish(draft));
  }

  /** Patch canonical state and synchronize any active bridged surfaces. */
  update(
    id: string,
    patch: PixelNotificationUpdate,
    options: PixelNotificationMutationOptions = {},
  ): PixelNotification | null {
    const current = this.store.get(id);
    const updated = this.store.patch(id, patch);
    if (!updated) {
      return null;
    }
    const routed = this.route(updated);
    const next = routed.channels === updated.channels ? updated : this.store.upsert(routed);
    this.syncDelivery(next);
    this.emitChange('updated', next);
    this.track('updated', next);
    this.emitLocalMutation(options.source ?? 'local', {
      type: 'update',
      id,
      patch,
      lastKnownUpdatedAt: current?.updatedAt,
    });
    return next;
  }

  /** Read a canonical record by id. */
  get(id: string): PixelNotification | null {
    return this.store.get(id);
  }

  /** Mark one inbox record as read. */
  markRead(
    id: string,
    options: PixelNotificationMutationOptions = {},
  ): PixelNotification | null {
    const updated = this.store.markRead(id);
    if (updated) {
      this.emitChange('read', updated);
      this.track('read', updated);
      this.emitLocalMutation(options.source ?? 'local', { type: 'read', id });
    }
    return updated;
  }

  /** Return one inbox record to unread state. */
  markUnread(
    id: string,
    options: PixelNotificationMutationOptions = {},
  ): PixelNotification | null {
    const updated = this.store.markUnread(id);
    if (updated) {
      this.emitChange('unread', updated);
      this.track('unread', updated);
      this.emitLocalMutation(options.source ?? 'local', { type: 'unread', id });
    }
    return updated;
  }

  /** Mark every active inbox record as read in one immutable update. */
  markAllRead(options: PixelNotificationMutationOptions = {}): void {
    this.store.markAllRead();
    this.emitChange('read', null);
    this.track('read', null);
    this.emitLocalMutation(options.source ?? 'local', { type: 'mark-all-read' });
  }

  /** Archive a record and dismiss its active bridged surfaces. */
  archive(
    id: string,
    options: PixelNotificationMutationOptions = {},
  ): PixelNotification | null {
    const updated = this.store.archive(id);
    if (updated) {
      this.removeToast(id);
      this.closeDialog(id);
      this.emitChange('archived', updated);
      this.track('archived', updated);
      this.emitLocalMutation(options.source ?? 'local', { type: 'archive', id });
    }
    return updated;
  }

  /** Restore an archived record without replaying delivery channels. */
  restore(
    id: string,
    options: PixelNotificationMutationOptions = {},
  ): PixelNotification | null {
    const updated = this.store.restore(id);
    if (updated) {
      this.emitChange('restored', updated);
      this.track('restored', updated);
      this.emitLocalMutation(options.source ?? 'local', { type: 'restore', id });
    }
    return updated;
  }

  /** Permanently remove a record and dismiss its active bridged surfaces. */
  remove(
    id: string,
    options: PixelNotificationMutationOptions = {},
  ): PixelNotification | null {
    const removed = this.store.remove(id);
    if (removed) {
      this.removeToast(id);
      this.closeDialog(id);
      this.emitChange('removed', removed);
      this.track('removed', removed);
      this.emitLocalMutation(options.source ?? 'local', { type: 'remove', id });
    }
    return removed;
  }

  /** Clear notification-owned state and surfaces without touching direct application toasts. */
  clear(options: PixelNotificationMutationOptions = {}): void {
    for (const notificationId of [...this.toastIds.keys()]) {
      this.removeToast(notificationId);
    }
    for (const notificationId of [...this.dialogRefs.keys()]) {
      this.closeDialog(notificationId);
    }
    this.store.clear();
    this.emitChange('cleared', null);
    this.track('cleared', null);
    this.emitLocalMutation(options.source ?? 'local', { type: 'clear' });
  }

  /** Emit and invoke a typed action; marks the record read unless the action opts out. */
  async invokeAction(
    notificationId: string,
    actionId: string,
  ): Promise<PixelNotificationActionEvent | null> {
    const notification = this.store.get(notificationId);
    const action = notification?.actions.find((candidate) => candidate.id === actionId);
    if (!notification || !action) {
      return null;
    }
    const event: PixelNotificationActionEvent = { notification, action };
    this.actionEvents.set(event);
    this.track('action', notification, { actionId });
    if (action.markRead !== false) {
      this.markRead(notificationId);
    }
    await action.handler?.({ notification, action });
    return event;
  }

  /** Remove records whose `expiresAt` timestamp has elapsed. No background polling is used. */
  pruneExpired(now = Date.now()): readonly PixelNotification[] {
    const expired = this.store.pruneExpired(now);
    for (const notification of expired) {
      this.removeToast(notification.id);
      this.closeDialog(notification.id);
      this.emitChange('removed', notification);
      this.track('removed', notification);
    }
    return expired;
  }

  private normalize(
    draft: PixelNotificationCreate,
    now: number,
  ): PixelNotification {
    return {
      id: draft.id?.trim() || `pixel-notification-${++nextNotificationId}`,
      title: draft.title.trim(),
      message: draft.message?.trim() ?? '',
      severity: draft.severity ?? this.config.defaultSeverity,
      priority: draft.priority ?? this.config.defaultPriority,
      state: draft.state ?? 'default',
      category: draft.category?.trim() ?? '',
      source: draft.source?.trim() ?? '',
      icon: draft.icon?.trim() ?? '',
      imageSrc: draft.imageSrc?.trim() ?? '',
      createdAt: normalizeTimestamp(draft.createdAt, now),
      updatedAt: now,
      expiresAt: normalizeOptionalTimestamp(draft.expiresAt),
      readAt: null,
      archivedAt: null,
      progress: normalizeProgress(draft.progress),
      occurrences: 1,
      actions: [...(draft.actions ?? [])],
      channels: [...(draft.channels ?? [])],
      dedupeKey: draft.dedupeKey?.trim() ?? '',
      data: { ...(draft.data ?? {}) },
    };
  }

  private route(notification: PixelNotification): PixelNotification {
    const route = this.channelPolicy(notification);
    return {
      ...notification,
      channels: uniqueChannels(route.channels),
    };
  }

  private effectiveChannels(
    notification: PixelNotification,
  ): readonly PixelNotificationChannel[] {
    return this.applyPreferences(notification.channels, notification);
  }

  private applyPreferences(
    channels: readonly PixelNotificationChannel[],
    notification: PixelNotification,
  ): readonly PixelNotificationChannel[] {
    const preferences = this.preferencesState();
    const muted =
      !!notification.category &&
      preferences.mutedCategories.includes(notification.category);
    const quiet = isWithinQuietHours(preferences);
    return channels.filter((channel) => {
      if (preferences.disabledChannels.includes(channel)) {
        return false;
      }
      if ((muted || quiet) && channel !== 'inbox') {
        return false;
      }
      return true;
    });
  }

  private syncDelivery(notification: PixelNotification): void {
    this.syncToast(notification);
    this.syncDialog(notification);
  }

  /**
   * Preference updates only tear down interruptive UI that is no longer allowed.
   * Re-opening toast/dialog for every stored record would flood the screen after demos
   * or long-lived inboxes.
   */
  private reconcileInterruptiveDelivery(notification: PixelNotification): void {
    const channels = this.effectiveChannels(notification);
    if (!channels.includes('toast') || notification.archivedAt !== null) {
      this.removeToast(notification.id);
    }
    if (!channels.includes('dialog') || notification.archivedAt !== null) {
      this.closeDialog(notification.id);
    }
  }

  private syncToast(notification: PixelNotification): void {
    if (
      !this.effectiveChannels(notification).includes('toast') ||
      notification.archivedAt !== null
    ) {
      this.removeToast(notification.id);
      return;
    }

    const config = this.toToastConfig(notification);
    const toastId = this.toastIds.get(notification.id);
    if (toastId) {
      this.toast.update(toastId, config);
      if (notification.progress !== null) {
        this.toast.setProgress(toastId, notification.progress);
      }
      return;
    }

    const nextToastId = this.toast.show(config);
    this.toastIds.set(notification.id, nextToastId);
    if (notification.progress !== null) {
      this.toast.setProgress(nextToastId, notification.progress);
    }
  }

  private syncDialog(notification: PixelNotification): void {
    if (
      typeof document === 'undefined' ||
      !this.effectiveChannels(notification).includes('dialog') ||
      notification.archivedAt !== null
    ) {
      this.closeDialog(notification.id);
      return;
    }

    if (this.dialogRefs.has(notification.id)) {
      return;
    }

    const ref = this.dialog.open(PixelNotificationDialogComponent, {
      data: { notification },
      title: notification.title,
      size: 'sm',
      role: 'alertdialog',
      disableClose: notification.priority === 'critical',
    });
    this.dialogRefs.set(notification.id, ref);
    ref.afterClosed().subscribe(() => {
      this.dialogRefs.delete(notification.id);
    });
  }

  private toToastConfig(notification: PixelNotification): PixelToastConfig {
    const persistent =
      notification.priority === 'critical' && this.config.criticalToastPersistent;
    return {
      type: resolveToastType(notification),
      title: notification.title,
      message: notification.message,
      icon: notification.icon || undefined,
      imageSrc: notification.imageSrc || undefined,
      category: notification.category || undefined,
      timestamp: notification.createdAt,
      timeOut:
        notification.priority === 'high'
          ? this.config.highPriorityToastTimeout
          : undefined,
      disableTimeOut: persistent || notification.state === 'loading',
      progressBar: notification.progress !== null,
      duplicatePrevention: true,
      duplicateKey: `pixel-notification:${notification.id}`,
      actions: notification.actions.map((action) => ({
        id: action.id,
        label: action.label,
        ariaLabel: action.ariaLabel,
        primary: action.appearance === 'primary',
      })),
      onTap: () => this.markRead(notification.id),
      onAction: (actionId) => {
        void this.invokeAction(notification.id, actionId).catch(() => undefined);
      },
      onClose: () => this.toastIds.delete(notification.id),
    };
  }

  private removeToast(notificationId: string): void {
    const toastId = this.toastIds.get(notificationId);
    if (!toastId) {
      return;
    }
    this.toastIds.delete(notificationId);
    this.toast.remove(toastId);
  }

  private closeDialog(notificationId: string): void {
    const ref = this.dialogRefs.get(notificationId);
    if (!ref) {
      return;
    }
    this.dialogRefs.delete(notificationId);
    ref.close();
  }

  private emitChange(
    type: PixelNotificationChangeEvent['type'],
    notification: PixelNotification | null,
  ): void {
    this.changeEvents.set({ type, notification });
  }

  private track(
    name: NonNullable<Parameters<PixelNotificationAnalytics['track']>[0]>['name'],
    notification: PixelNotification | null,
    data?: Readonly<Record<string, unknown>>,
  ): void {
    this.analytics?.track({ name, notification, data });
  }

  private emitLocalMutation(
    source: PixelNotificationMutationOptions['source'],
    mutation: {
      readonly type: PixelNotificationClientMutationType;
      readonly id?: string;
      readonly notification?: PixelNotificationCreate;
      readonly patch?: PixelNotificationUpdate;
      readonly lastKnownUpdatedAt?: number;
    },
  ): void {
    if (source !== 'local') {
      return;
    }
    this.injector.get(PixelNotificationSyncService, null, { optional: true })?.notifyLocalMutation(
      mutation,
    );
  }
}

function isCanonicalNotification(
  value: PixelNotificationCreate | PixelNotification,
): value is PixelNotification {
  return (
    typeof (value as PixelNotification).id === 'string' &&
    typeof (value as PixelNotification).updatedAt === 'number' &&
    Array.isArray((value as PixelNotification).channels)
  );
}

function uniqueChannels(
  channels: readonly PixelNotificationChannel[],
): readonly PixelNotificationChannel[] {
  return [...new Set(channels)];
}

function resolveToastType(notification: PixelNotification): PixelToastType {
  if (notification.state === 'loading') {
    return 'loading';
  }
  if (notification.state === 'failed') {
    return 'error';
  }
  return severityToToastType(notification.severity);
}

function severityToToastType(severity: PixelNotificationSeverity): PixelToastType {
  return severity === 'neutral' ? 'default' : severity;
}

function normalizeTimestamp(
  value: number | string | Date | undefined,
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : fallback;
}

function normalizeOptionalTimestamp(
  value: number | string | Date | null | undefined,
): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function normalizeProgress(value: number | null | undefined): number | null {
  return value === undefined || value === null
    ? null
    : Math.max(0, Math.min(100, value));
}
