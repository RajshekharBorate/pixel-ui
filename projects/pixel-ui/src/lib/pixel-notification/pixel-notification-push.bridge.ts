import { DestroyRef, Injectable, Injector, effect, inject, signal } from '@angular/core';
import { getNotificationNavigateRequest } from '../services/navigate/notification-nav';
import { PixelNavigateService } from '../services/navigate/navigate.service';
import { PIXEL_NOTIFICATION_ANALYTICS } from './pixel-notification.config';
import { PixelNotificationService } from './pixel-notification.service';
import { PixelNotificationSyncService } from './pixel-notification.sync';
import type { PixelNotificationPreferences } from './pixel-notification.adapters';
import type {
  PixelPushClickMessage,
  PixelPushClientMessage,
  PixelPushPayload,
  PixelPushReceivedMessage,
} from './pixel-notification-push.types';
import {
  isPixelPushClientMessage,
  writePixelPushPrefsCache,
} from './pixel-notification-push.sw';

export interface PixelPushActivateEvent {
  readonly notificationId?: string;
  readonly actionId?: string;
  readonly nav?: string | Readonly<Record<string, unknown>>;
  readonly payload?: PixelPushPayload;
}

/**
 * Bridges Service Worker push messages into the in-app notification store and mirrors
 * preferences for OS-notification gating. Call {@link start} once the app shell is ready.
 *
 * Click order: focus/open (SW) → ingest if needed → markRead / invokeAction (bound handlers) →
 * optional {@link PixelNavigateService.openFromNotification}.
 */
@Injectable()
export class PixelPushNotificationBridge {
  private readonly notifications = inject(PixelNotificationService);
  private readonly sync = inject(PixelNotificationSyncService, { optional: true });
  private readonly analytics = inject(PIXEL_NOTIFICATION_ANALYTICS, { optional: true });
  private readonly navigate = inject(PixelNavigateService, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private started = false;
  private removeMessageListener: (() => void) | null = null;
  private stopPrefsEffect: (() => void) | null = null;

  readonly lastReceived = signal<PixelPushPayload | null>(null);
  readonly lastActivated = signal<PixelPushActivateEvent | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => this.stop());
  }

  /**
   * Listen for SW protocol messages and keep the prefs cache warm.
   * Idempotent. SSR no-op.
   */
  start(): void {
    if (this.started || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    this.started = true;
    this.mirrorPreferences(this.notifications.preferences());

    const onMessage = (event: MessageEvent) => this.onWorkerMessage(event.data);
    navigator.serviceWorker.addEventListener('message', onMessage);
    this.removeMessageListener = () =>
      navigator.serviceWorker.removeEventListener('message', onMessage);

    const prefsEffect = effect(
      () => {
        this.mirrorPreferences(this.notifications.preferences());
      },
      { injector: this.injector },
    );
    this.stopPrefsEffect = () => prefsEffect.destroy();
  }

  stop(): void {
    this.removeMessageListener?.();
    this.removeMessageListener = null;
    this.stopPrefsEffect?.();
    this.stopPrefsEffect = null;
    this.started = false;
  }

  /** Write prefs for the page cache and notify the active worker. */
  mirrorPreferences(preferences: PixelNotificationPreferences): void {
    writePixelPushPrefsCache(preferences);
    if (typeof navigator === 'undefined' || !navigator.serviceWorker?.controller) {
      return;
    }
    navigator.serviceWorker.controller.postMessage({
      type: 'pixel-push-prefs',
      preferences: {
        mutedCategories: [...preferences.mutedCategories],
        disabledChannels: [...preferences.disabledChannels],
        quietHoursEnabled: preferences.quietHoursEnabled,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
      },
    });
  }

  /** Apply a push payload as a remote upsert (tests / tooling). */
  ingestPayload(payload: PixelPushPayload): string {
    this.lastReceived.set(payload);
    this.analytics?.track({
      name: 'push_received',
      data: { id: payload.notification.id, dedupeKey: payload.notification.dedupeKey },
    });
    if (this.sync) {
      this.sync.applyTransportEvent({
        type: 'upsert',
        notification: payload.notification,
      });
      return payload.notification.id ?? '';
    }
    return this.notifications.publish(payload.notification, { source: 'remote' });
  }

  /**
   * Same handling as a Service Worker `pixel-push-click` message (without SW focus/openWindow).
   * Useful for docs demos and unit tests.
   */
  handleActivation(
    message: Omit<PixelPushClickMessage, 'type'> & { readonly type?: 'pixel-push-click' },
  ): Promise<void> {
    return this.onClick({
      type: 'pixel-push-click',
      notificationId: message.notificationId,
      actionId: message.actionId,
      nav: message.nav,
      payload: message.payload,
    });
  }

  private onWorkerMessage(data: unknown): void {
    if (!isPixelPushClientMessage(data)) {
      return;
    }
    const message = data as PixelPushClientMessage;
    switch (message.type) {
      case 'pixel-push-received':
        this.onReceived(message);
        break;
      case 'pixel-push-click':
        void this.onClick(message);
        break;
      default:
        break;
    }
  }

  private onReceived(message: PixelPushReceivedMessage): void {
    this.ingestPayload(message.payload);
  }

  private async onClick(message: PixelPushClickMessage): Promise<void> {
    const event: PixelPushActivateEvent = {
      notificationId: message.notificationId,
      actionId: message.actionId,
      nav: message.nav,
      payload: message.payload,
    };
    this.lastActivated.set(event);
    this.analytics?.track({
      name: 'push_clicked',
      data: {
        notificationId: message.notificationId,
        actionId: message.actionId,
        hasNav: message.nav != null,
      },
    });

    let notificationId = message.notificationId?.trim() || '';
    if (message.payload?.notification) {
      const existing = notificationId ? this.notifications.get(notificationId) : null;
      if (!existing) {
        notificationId = this.ingestPayload(message.payload) || notificationId;
      }
    }
    if (!notificationId) {
      return;
    }

    if (message.actionId) {
      await this.notifications.invokeAction(notificationId, message.actionId);
    } else {
      this.notifications.markRead(notificationId);
    }

    await this.navigateFromClick(notificationId, message.actionId);
  }

  private async navigateFromClick(
    notificationId: string,
    actionId: string | undefined,
  ): Promise<void> {
    if (!this.navigate) {
      return;
    }
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return;
    }
    const action = actionId
      ? notification.actions.find((candidate) => candidate.id === actionId)
      : undefined;
    const request = getNotificationNavigateRequest(notification, action);
    if (!request) {
      return;
    }
    try {
      await this.navigate.go({
        ...request,
        // Allow route change + adapter/anchor registration after focus.
        timeoutMs: request.timeoutMs ?? 8_000,
        highlight: request.highlight !== false,
        focus: request.focus !== false,
        onFailure: request.onFailure ?? 'silent',
        source: request.source ?? 'notification',
      });
    } catch {
      // Soft-fail: navigation must not break click handling.
    }
  }
}
