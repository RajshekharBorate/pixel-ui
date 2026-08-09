import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import {
  PixelButtonComponent,
  PixelNotificationPreferencesComponent,
  PixelNotificationPushPromptComponent,
  PixelNotificationService,
  PixelPushMemorySubscriptionAdapter,
  PixelPushNotificationService,
  buildOsNotificationOptions,
  providePixelPushNotifications,
  shouldShowOsNotification,
  type PixelNotificationPreferences,
  type PixelPushPayload,
  type PixelPushServiceWorkerAdapter,
} from 'pixel-ui';

/**
 * In-memory PushManager so Enable works without a push gateway / VAPID.
 * OS notifications in this demo use a separately registered real SW (or `Notification`).
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
 * Docs-only demo. Enable uses an in-memory subscription adapter (no real push server).
 * “Show system notification” registers `/pixel-push-sw.js` when possible and calls
 * `showNotification` so high-priority demos appear in the OS notification center.
 */
@Component({
  selector: 'docs-notification-push-example',
  imports: [
    PixelButtonComponent,
    PixelNotificationPushPromptComponent,
    PixelNotificationPreferencesComponent,
  ],
  providers: [
    providePixelPushNotifications({
      subscription: new PixelPushMemorySubscriptionAdapter(),
      serviceWorker: createDocsPushServiceWorkerAdapter(),
    }),
  ],
  template: `
    <div class="notification-push-demo">
      <pixel-notification-push-prompt
        deviceLabel="docs-demo"
        (enabled)="lastResult.set($event.ok ? 'enabled' : ($event.error ?? 'failed'))"
        (disabled)="lastResult.set($event.ok ? 'disabled' : ($event.error ?? 'failed'))"
      />

      <pixel-notification-preferences
        [categories]="['approvals', 'security', 'billing']"
        [(preferences)]="preferences"
        (preferencesChange)="onPreferences($event)"
      />

      <div class="notification-push-demo__actions">
        <pixel-button appearance="outline" size="sm" (click)="simulateSystemNotification()">
          Show system notification
        </pixel-button>
        <pixel-button appearance="outline" size="sm" (click)="simulateInboxOnly()">
          Inbox only (no OS)
        </pixel-button>
        <pixel-button appearance="text" size="sm" (click)="push.refresh()">
          Refresh push status
        </pixel-button>
      </div>

      <p aria-live="polite">
        Status: {{ push.status() }} · permission: {{ push.permission() }}
        @if (lastResult()) {
          · last: {{ lastResult() }}
        }
      </p>
      <p class="notification-push-demo__hint">
        1) Click <strong>Enable push</strong> (grants permission). 2) Click
        <strong>Show system notification</strong> to fire a high-priority OS notification via
        <code>/pixel-push-sw.js</code> (or the page Notification API). Quiet hours / muted
        categories / Disable push suppress the OS toast. There is no real push gateway in docs —
        production apps send Web Push from the server to the subscription endpoint.
      </p>
    </div>
  `,
  styles: `
    .notification-push-demo {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .notification-push-demo__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .notification-push-demo__hint {
      margin: 0;
      color: var(--pixel-sys-on-surface-variant, #49454f);
      font-size: 0.8125rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPushExample {
  protected readonly push = inject(PixelPushNotificationService);
  private readonly notifications = inject(PixelNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly preferences = signal<PixelNotificationPreferences>({
    mutedCategories: [],
    disabledChannels: [],
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });
  readonly lastResult = signal('');

  constructor() {
    void this.ensureDemoServiceWorker();
    this.destroyRef.onDestroy(() => {
      /* SW stays registered for the docs origin; apps may unregister on teardown if desired. */
    });
  }

  onPreferences(next: PixelNotificationPreferences): void {
    this.preferences.set(next);
    this.notifications.setPreferences(next);
  }

  /** High-priority inbox upsert only (matches server→inbox without OS chrome). */
  simulateInboxOnly(): void {
    this.publishDemoRecord();
    this.lastResult.set('inbox-only');
  }

  /**
   * Upserts the inbox and shows an OS / system notification when permission allows and
   * preferences do not suppress the `push` channel.
   */
  async simulateSystemNotification(): Promise<void> {
    const payload = this.demoPayload();
    this.publishDemoRecord(payload);

    if (typeof Notification === 'undefined') {
      this.lastResult.set('Notification API unavailable');
      return;
    }
    if (Notification.permission !== 'granted') {
      this.lastResult.set('enable push first (permission required)');
      return;
    }
    if (!shouldShowOsNotification(payload, this.preferences())) {
      this.lastResult.set('OS suppressed by preferences');
      return;
    }

    try {
      await this.showOsNotification(payload);
      this.lastResult.set('system-notification');
    } catch (error) {
      this.lastResult.set(
        error instanceof Error ? error.message : 'Failed to show system notification',
      );
    }
  }

  private publishDemoRecord(payload: PixelPushPayload = this.demoPayload()): void {
    // Stable dedupe so repeated demos update one inbox row instead of stacking forever.
    this.notifications.publish(
      {
        ...payload.notification,
        id: 'docs-push-demo',
        dedupeKey: 'docs-push-demo',
      },
      { source: 'remote' },
    );
  }

  private demoPayload(): PixelPushPayload {
    return {
      notification: {
        title: 'High-priority approval',
        message: 'Travel request TR-104 needs your review (docs demo system notification).',
        priority: 'high',
        severity: 'warning',
        category: 'approvals',
        icon: 'approval',
        actions: [
          { id: 'review', label: 'Review' },
          { id: 'later', label: 'Later' },
        ],
      },
      push: {
        tag: 'docs-push-demo',
        renotify: true,
        requireInteraction: false,
      },
    };
  }

  private async ensureDemoServiceWorker(): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    try {
      await navigator.serviceWorker.register('/pixel-push-sw.js', { scope: '/' });
    } catch {
      // Localhost without the file, or ngsw conflict — page Notification API remains a fallback.
    }
  }

  private async showOsNotification(payload: PixelPushPayload): Promise<void> {
    const { title, options } = buildOsNotificationOptions(payload);
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration =
          (await navigator.serviceWorker.getRegistration('/')) ??
          (await navigator.serviceWorker.ready);
        if (registration?.showNotification) {
          // Replace prior demo OS notifications with the same tag instead of stacking.
          const existing = await registration.getNotifications?.({ tag: 'docs-push-demo' });
          existing?.forEach((notification) => notification.close());
          await registration.showNotification(title, options);
          return;
        }
      } catch {
        /* fall through */
      }
    }
    // Page-level fallback when no SW can show the notification.
    const { actions: _actions, ...pageOptions } = options as NotificationOptions & {
      actions?: unknown;
    };
    new Notification(title, pageOptions);
  }
}
