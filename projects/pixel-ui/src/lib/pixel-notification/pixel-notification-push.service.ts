import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { PixelNavigateService } from '../services/navigate/navigate.service';
import { PIXEL_NOTIFICATION_ANALYTICS } from './pixel-notification.config';
import { PixelNotificationService } from './pixel-notification.service';
import {
  decodeVapidPublicKey,
  toPushSubscriptionRecord,
  type PixelPushSubscriptionAdapter,
} from './pixel-notification-push.adapters';
import { PixelPushNotificationBridge } from './pixel-notification-push.bridge';
import {
  PIXEL_PUSH_SERVICE_WORKER_ADAPTER,
  PIXEL_PUSH_SUBSCRIPTION_ADAPTER,
} from './pixel-notification-push.config';
import {
  PIXEL_PUSH_COLD_START_ACTION_PARAM,
  PIXEL_PUSH_COLD_START_ID_PARAM,
} from './pixel-notification-push.deep-link';
import type {
  PixelPushOperationResult,
  PixelPushPermissionState,
  PixelPushStatus,
  PixelPushSubscriptionRecord,
} from './pixel-notification-push.types';

/**
 * Web Push lifecycle orchestrator. Feature-detects Push / Notification APIs, manages
 * permission + subscription, persists via {@link PixelPushSubscriptionAdapter}, and can
 * start the inbox bridge ({@link PixelPushNotificationBridge}).
 *
 * SSR-safe: browser APIs are gated; signals default to `unsupported` on the server.
 */
@Injectable()
export class PixelPushNotificationService {
  private readonly subscriptionAdapter = inject(PIXEL_PUSH_SUBSCRIPTION_ADAPTER);
  private readonly serviceWorkerAdapter = inject(PIXEL_PUSH_SERVICE_WORKER_ADAPTER, {
    optional: true,
  });
  private readonly analytics = inject(PIXEL_NOTIFICATION_ANALYTICS, { optional: true });
  private readonly bridge = inject(PixelPushNotificationBridge);
  private readonly notifications = inject(PixelNotificationService);
  private readonly navigate = inject(PixelNavigateService, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private coldStartConsumed = false;

  private readonly permissionState = signal<PixelPushPermissionState>(detectPermissionState());
  private readonly subscriptionState = signal<PixelPushSubscriptionRecord | null>(null);
  private readonly busyState = signal(false);
  private readonly lastErrorState = signal<string | null>(null);
  private subscriptionChangeBound = false;

  readonly permission = this.permissionState.asReadonly();
  readonly subscription = this.subscriptionState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly lastError = this.lastErrorState.asReadonly();

  readonly supported = computed(() => {
    const permission = this.permission();
    return permission !== 'unsupported' && permission !== 'insecure-context';
  });

  readonly status = computed<PixelPushStatus>(() => {
    if (this.busy()) {
      return 'busy';
    }
    if (this.lastError()) {
      return 'error';
    }
    if (this.subscription()) {
      return 'subscribed';
    }
    return 'idle';
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.teardownSubscriptionChangeListener());
  }

  /**
   * Starts the SW → inbox bridge and (when supported) listens for `pushsubscriptionchange`.
   * Call after login / SW registration. Idempotent.
   * Also consumes cold-start `?pixelPushId=` / `?pixelPushAction=` from `openWindow` deep links.
   */
  start(): void {
    this.bridge.start();
    void this.refresh();
    this.bindSubscriptionChangeListener();
    void this.consumeColdStartDeepLink();
  }

  /**
   * After a cold-start `openWindow`, markRead / invokeAction from query params, then
   * optionally run {@link PixelNavigateService.goFromUrl} when navigate is available.
   */
  private async consumeColdStartDeepLink(): Promise<void> {
    if (this.coldStartConsumed || typeof location === 'undefined') {
      return;
    }
    this.coldStartConsumed = true;
    const params = new URLSearchParams(location.search);
    const notificationId = params.get(PIXEL_PUSH_COLD_START_ID_PARAM)?.trim() ?? '';
    const actionId = params.get(PIXEL_PUSH_COLD_START_ACTION_PARAM)?.trim() ?? '';
    if (notificationId) {
      if (actionId) {
        await this.notifications.invokeAction(notificationId, actionId);
      } else {
        this.notifications.markRead(notificationId);
      }
    }
    if (this.navigate && (params.has('nav') || location.hash.length > 1)) {
      try {
        await this.navigate.goFromUrl();
      } catch {
        /* soft-fail */
      }
    }
  }

  stop(): void {
    this.bridge.stop();
    this.teardownSubscriptionChangeListener();
  }

  /**
   * Re-reads permission and any existing `PushSubscription` without prompting.
   * Safe to call after login or when the app shell becomes interactive.
   */
  async refresh(): Promise<PixelPushOperationResult> {
    if (typeof window === 'undefined') {
      return this.snapshot('Push is not available during SSR.');
    }
    this.permissionState.set(detectPermissionState());
    if (!this.supported()) {
      this.subscriptionState.set(null);
      return this.snapshot();
    }
    try {
      const registration = await this.resolveRegistration();
      const pushSubscription = await registration?.pushManager.getSubscription();
      this.subscriptionState.set(
        pushSubscription ? toPushSubscriptionRecord(pushSubscription) : null,
      );
      this.lastErrorState.set(null);
    } catch (error) {
      this.lastErrorState.set(toErrorMessage(error));
      this.analytics?.track({ name: 'push_failed', data: { phase: 'refresh', error: toErrorMessage(error) } });
    }
    return this.snapshot();
  }

  /**
   * Requests notification permission (if needed), creates a Web Push subscription, and
   * POSTs it through the configured subscription adapter.
   */
  async enable(options?: { readonly deviceLabel?: string }): Promise<PixelPushOperationResult> {
    if (typeof window === 'undefined') {
      return this.fail('Push is not available during SSR.');
    }
    const adapter = this.requireSubscriptionAdapter();
    if (!adapter.ok) {
      return adapter.result;
    }
    if (!this.supported() && detectPermissionState() === 'unsupported') {
      return this.fail('Web Push is not supported in this browser.');
    }
    if (detectPermissionState() === 'insecure-context') {
      this.permissionState.set('insecure-context');
      return this.fail('Web Push requires a secure context (HTTPS).');
    }

    this.busyState.set(true);
    this.lastErrorState.set(null);
    this.analytics?.track({ name: 'push_permission_prompted' });
    try {
      const permission = await requestNotificationPermission();
      this.permissionState.set(permission);
      if (permission !== 'granted') {
        this.analytics?.track({ name: 'push_permission_denied', data: { permission } });
        return this.fail(
          permission === 'denied'
            ? 'Notification permission was denied.'
            : 'Notification permission was not granted.',
        );
      }
      this.analytics?.track({ name: 'push_permission_granted' });

      const registration = await this.resolveRegistration();
      if (!registration) {
        return this.fail(
          'No Service Worker registration found. Register a worker before enabling push.',
        );
      }

      let pushSubscription = await registration.pushManager.getSubscription();
      if (!pushSubscription) {
        const vapidKey = await adapter.adapter.getVapidPublicKey();
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidPublicKey(vapidKey) as BufferSource,
        });
      }

      const record = toPushSubscriptionRecord(pushSubscription, {
        deviceLabel: options?.deviceLabel,
      });
      await adapter.adapter.saveSubscription(record);
      this.subscriptionState.set(record);
      this.analytics?.track({
        name: 'push_subscribed',
        data: { endpoint: record.endpoint },
      });
      this.bridge.start();
      return this.snapshot();
    } catch (error) {
      this.analytics?.track({ name: 'push_failed', data: { phase: 'enable', error: toErrorMessage(error) } });
      return this.fail(toErrorMessage(error));
    } finally {
      this.busyState.set(false);
    }
  }

  /**
   * Unsubscribes the browser endpoint and asks the adapter to delete the server record.
   */
  async disable(): Promise<PixelPushOperationResult> {
    if (typeof window === 'undefined') {
      return this.fail('Push is not available during SSR.');
    }
    const adapter = this.requireSubscriptionAdapter();
    if (!adapter.ok) {
      return adapter.result;
    }

    this.busyState.set(true);
    this.lastErrorState.set(null);
    try {
      const registration = await this.resolveRegistration();
      const pushSubscription = await registration?.pushManager.getSubscription();
      const current =
        this.subscriptionState() ??
        (pushSubscription ? toPushSubscriptionRecord(pushSubscription) : null);

      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }
      if (current) {
        await adapter.adapter.deleteSubscription(current);
      }
      this.subscriptionState.set(null);
      this.permissionState.set(detectPermissionState());
      this.analytics?.track({
        name: 'push_unsubscribed',
        data: { endpoint: current?.endpoint },
      });
      return this.snapshot();
    } catch (error) {
      this.analytics?.track({ name: 'push_failed', data: { phase: 'disable', error: toErrorMessage(error) } });
      return this.fail(toErrorMessage(error));
    } finally {
      this.busyState.set(false);
    }
  }

  /**
   * After login: refresh local subscription and re-POST to the adapter when one exists.
   * Does not prompt for permission.
   */
  async rebindAfterLogin(options?: { readonly deviceLabel?: string }): Promise<PixelPushOperationResult> {
    const refreshed = await this.refresh();
    if (!refreshed.subscription) {
      return refreshed;
    }
    const adapter = this.requireSubscriptionAdapter();
    if (!adapter.ok) {
      return adapter.result;
    }
    try {
      const record = options?.deviceLabel
        ? { ...refreshed.subscription, deviceLabel: options.deviceLabel }
        : refreshed.subscription;
      await adapter.adapter.saveSubscription(record);
      this.subscriptionState.set(record);
      this.lastErrorState.set(null);
      this.bridge.start();
      return this.snapshot();
    } catch (error) {
      return this.fail(toErrorMessage(error));
    }
  }

  /**
   * On logout: unsubscribe locally and delete the server record. Prefer this over leaving
   * orphaned endpoints bound to the previous user.
   */
  async clearOnLogout(): Promise<PixelPushOperationResult> {
    return this.disable();
  }

  /** Immutable snapshot of permission + subscription (same shape as operation results). */
  getSubscriptionSnapshot(): PixelPushOperationResult {
    return this.snapshot();
  }

  private bindSubscriptionChangeListener(): void {
    if (this.subscriptionChangeBound || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    this.subscriptionChangeBound = true;
    navigator.serviceWorker.addEventListener('controllerchange', this.onControllerChange);
  }

  private teardownSubscriptionChangeListener(): void {
    if (!this.subscriptionChangeBound || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    navigator.serviceWorker.removeEventListener('controllerchange', this.onControllerChange);
    this.subscriptionChangeBound = false;
  }

  private readonly onControllerChange = (): void => {
    void this.handleSubscriptionRotation();
  };

  /**
   * Handles expired/rotated endpoints. Browsers fire `pushsubscriptionchange` on the SW;
   * the page reacts to controller changes and refresh + re-save when still granted.
   */
  private async handleSubscriptionRotation(): Promise<void> {
    if (detectPermissionState() !== 'granted') {
      return;
    }
    this.analytics?.track({ name: 'push_subscription_changed' });
    const result = await this.refresh();
    if (!result.subscription) {
      // Endpoint gone — try to create a fresh one without re-prompting.
      await this.enable();
      return;
    }
    await this.rebindAfterLogin();
  }

  private async resolveRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (this.serviceWorkerAdapter) {
      return this.serviceWorkerAdapter.getRegistration();
    }
    return defaultGetServiceWorkerRegistration();
  }

  private requireSubscriptionAdapter():
    | { ok: true; adapter: PixelPushSubscriptionAdapter }
    | { ok: false; result: PixelPushOperationResult } {
    return { ok: true, adapter: this.subscriptionAdapter };
  }

  private fail(message: string): PixelPushOperationResult {
    this.lastErrorState.set(message);
    return this.snapshot(message);
  }

  private snapshot(error?: string): PixelPushOperationResult {
    const lastError = error ?? this.lastErrorState();
    return {
      ok: !lastError,
      permission: this.permissionState(),
      subscription: this.subscriptionState(),
      ...(lastError ? { error: lastError } : {}),
    };
  }
}

function detectPermissionState(): PixelPushPermissionState {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'unsupported';
  }
  if (!window.isSecureContext) {
    return 'insecure-context';
  }
  const pushManager = (window as Window & { PushManager?: unknown }).PushManager;
  if (
    !('Notification' in window) ||
    !('serviceWorker' in navigator) ||
    pushManager == null
  ) {
    return 'unsupported';
  }
  const permission = Notification.permission;
  if (permission === 'granted') {
    return 'granted';
  }
  if (permission === 'denied') {
    return 'denied';
  }
  return 'default';
}

async function requestNotificationPermission(): Promise<PixelPushPermissionState> {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    return 'granted';
  }
  if (result === 'denied') {
    return 'denied';
  }
  return 'default';
}

async function defaultGetServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) {
    return existing;
  }
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Push operation failed.';
}
