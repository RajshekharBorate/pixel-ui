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
  PixelPushNotificationBridge,
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

const DOCS_PUSH_DEMO_ID = 'docs-push-demo';

/**
 * Docs-only demo. Enable uses an in-memory subscription adapter (no real push server).
 * OS recipes call `showNotification`; `push.start()` + bound handlers cover action clicks.
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
        <pixel-button appearance="outline" size="sm" (click)="simulateSystemNotification('severity')">
          OS · severity glyph
        </pixel-button>
        <pixel-button appearance="outline" size="sm" (click)="simulateSystemNotification('avatar')">
          OS · avatar
        </pixel-button>
        <pixel-button appearance="outline" size="sm" (click)="simulateSystemNotification('media')">
          OS · hero image
        </pixel-button>
        <pixel-button appearance="outline" size="sm" (click)="simulateOsAction('review')">
          Simulate OS · Review click
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
        @if (bridge.lastActivated(); as activated) {
          · activated: {{ activated.actionId || 'body' }}
        }
      </p>
      <p class="notification-push-demo__hint">
        1) <strong>Enable push</strong>. 2) Fire an <strong>OS ·</strong> recipe. 3) Click
        <strong>Review</strong> on the system toast (or <strong>Simulate OS · Review click</strong>).
        Bridge marks read, runs bound handlers, and navigates via <code>data.nav</code> /
        <code>action.nav</code> when present. <code>push.start()</code> is required for the
        in-app half of the click path.
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
  protected readonly bridge = inject(PixelPushNotificationBridge);
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
    this.push.start();
    this.notifications.bindActionHandlers({
      review: () => {
        this.lastResult.set('handler:review');
      },
      later: () => {
        this.lastResult.set('handler:later');
      },
      explore: () => {
        this.lastResult.set('handler:explore');
      },
    });
    void this.ensureDemoServiceWorker();
    this.destroyRef.onDestroy(() => {
      this.notifications.unbindActionHandlers(['review', 'later', 'explore']);
    });
  }

  onPreferences(next: PixelNotificationPreferences): void {
    this.preferences.set(next);
    this.notifications.setPreferences(next);
  }

  /** High-priority inbox upsert only (matches server→inbox without OS chrome). */
  simulateInboxOnly(): void {
    this.publishDemoRecord(this.demoPayload('severity'));
    this.lastResult.set('inbox-only');
  }

  /** Mimic SW `pixel-push-click` for Review without leaving the docs tab. */
  async simulateOsAction(actionId: string): Promise<void> {
    const payload = this.demoPayload('severity');
    this.publishDemoRecord(payload);
    await this.bridge.handleActivation({
      notificationId: DOCS_PUSH_DEMO_ID,
      actionId,
      payload,
      nav: payload.notification.actions?.find((action) => action.id === actionId)?.nav,
    });
    this.lastResult.set(`activation:${actionId}`);
  }

  /**
   * Upserts the inbox and shows an OS / system notification when permission allows and
   * preferences do not suppress the `push` channel.
   */
  async simulateSystemNotification(
    recipe: 'severity' | 'avatar' | 'media' = 'severity',
  ): Promise<void> {
    const payload = this.demoPayload(recipe);
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
      this.lastResult.set(`system-notification:${recipe}`);
    } catch (error) {
      this.lastResult.set(
        error instanceof Error ? error.message : 'Failed to show system notification',
      );
    }
  }

  private publishDemoRecord(payload: PixelPushPayload): void {
    this.notifications.publish(
      {
        ...payload.notification,
        id: DOCS_PUSH_DEMO_ID,
        dedupeKey: DOCS_PUSH_DEMO_ID,
      },
      { source: 'remote' },
    );
  }

  private demoPayload(recipe: 'severity' | 'avatar' | 'media'): PixelPushPayload {
    const reviewNav = {
      queryParams: { pushAction: 'review' },
      fragment: 'notification-push',
    } as const;

    if (recipe === 'avatar') {
      return {
        notification: {
          title: 'Alex Chen',
          message: 'Can you review the travel request when you have a moment?',
          priority: 'high',
          severity: 'info',
          category: 'approvals',
          imageSrc: 'https://i.pravatar.cc/96?u=pixel-push-docs',
          actions: [
            { id: 'review', label: 'Review', nav: reviewNav },
            { id: 'later', label: 'Later' },
          ],
          data: { nav: reviewNav },
        },
        push: {
          tag: DOCS_PUSH_DEMO_ID,
          leading: 'avatar',
          renotify: true,
        },
      };
    }

    if (recipe === 'media') {
      return {
        notification: {
          title: 'Product update',
          message: 'New analytics dashboard is ready to explore.',
          priority: 'high',
          severity: 'success',
          category: 'billing',
          icon: 'campaign',
          actions: [
            { id: 'explore', label: 'Explore', nav: { queryParams: { pushAction: 'explore' } } },
            { id: 'later', label: 'Later' },
          ],
        },
        push: {
          tag: DOCS_PUSH_DEMO_ID,
          leading: 'severity',
          image: 'https://picsum.photos/seed/pixel-push/480/240',
          renotify: true,
        },
      };
    }

    return {
      notification: {
        title: 'High-priority approval',
        message: 'Travel request TR-104 needs your review (docs demo system notification).',
        priority: 'high',
        severity: 'warning',
        category: 'approvals',
        icon: 'warning',
        actions: [
          { id: 'review', label: 'Review', nav: reviewNav },
          { id: 'later', label: 'Later' },
        ],
        data: { nav: reviewNav },
      },
      push: {
        tag: DOCS_PUSH_DEMO_ID,
        leading: 'severity',
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
          const existing = await registration.getNotifications?.({ tag: DOCS_PUSH_DEMO_ID });
          existing?.forEach((notification) => notification.close());
          await registration.showNotification(title, options);
          return;
        }
      } catch {
        /* fall through */
      }
    }
    const { actions: _actions, ...pageOptions } = options as NotificationOptions & {
      actions?: unknown;
    };
    new Notification(title, pageOptions);
  }
}
