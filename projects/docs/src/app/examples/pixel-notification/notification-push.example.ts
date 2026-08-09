import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  PixelButtonComponent,
  PixelNavAnchorDirective,
  PixelNotificationPreferencesComponent,
  PixelNotificationPushPromptComponent,
  PixelNotificationService,
  PixelPushNotificationBridge,
  PixelPushNotificationService,
  buildOsNotificationOptions,
  shouldShowOsNotification,
  type PixelNavigateRequest,
  type PixelNotificationPreferences,
  type PixelPushPayload,
} from 'pixel-ui';

const DOCS_PUSH_DEMO_ID = 'docs-push-demo';

type DocsPushRecipe = 'severity' | 'avatar' | 'media';

function recipeAnchorId(recipe: DocsPushRecipe): string {
  return `push-recipe-${recipe}`;
}

/** Deep-link back to this examples tab and highlight the recipe control that fired the OS toast. */
function docsPushNav(recipe: DocsPushRecipe): PixelNavigateRequest {
  return {
    route: ['components', 'pixel-notification', 'examples'],
    // One highlight target only — avoid ringing the whole example panel first.
    // focus:false so pixel-button outline + :focus-visible ring do not stack on the nav overlay.
    target: { type: 'section', id: recipeAnchorId(recipe) },
    syncUrl: true,
    highlight: true,
    focus: false,
    timeoutMs: 8_000,
    announce: 'Returned from system notification',
    source: 'notification',
    onFailure: 'silent',
  };
}

/**
 * Docs-only demo. Push DI + `push.start()` live on the app shell so the SW bridge
 * survives navigating away from this page (e.g. to `/components` then Review on the OS toast).
 */
@Component({
  selector: 'docs-notification-push-example',
  imports: [
    PixelButtonComponent,
    PixelNavAnchorDirective,
    PixelNotificationPushPromptComponent,
    PixelNotificationPreferencesComponent,
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
        <span [pixelNavAnchor]="recipeAnchorId('severity')" class="notification-push-demo__anchor">
          <pixel-button
            appearance="outline"
            size="sm"
            (click)="simulateSystemNotification('severity')"
          >
            OS · severity glyph
          </pixel-button>
        </span>
        <span [pixelNavAnchor]="recipeAnchorId('avatar')" class="notification-push-demo__anchor">
          <pixel-button
            appearance="outline"
            size="sm"
            (click)="simulateSystemNotification('avatar')"
          >
            OS · avatar
          </pixel-button>
        </span>
        <span [pixelNavAnchor]="recipeAnchorId('media')" class="notification-push-demo__anchor">
          <pixel-button
            appearance="outline"
            size="sm"
            (click)="simulateSystemNotification('media')"
          >
            OS · hero image
          </pixel-button>
        </span>
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
        1) <strong>Enable push</strong>. 2) Click an <strong>OS ·</strong> recipe. 3) You can leave
        this page (e.g. catalog) or switch browser tabs. 4) Click <strong>Review</strong> /
        <strong>Explore</strong> on the system toast — docs focuses, routes to examples, scrolls,
        and highlights the same recipe button.
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
      align-items: center;
    }
    .notification-push-demo__anchor {
      /* Padding so the overlay sits outside outline-button chrome. */
      display: inline-flex;
      padding: 0.35rem;
      /* Same as navigate basic .panel — highlight copies host border-radius. */
      border-radius: 0.5rem;
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

  readonly preferences = signal<PixelNotificationPreferences>({
    mutedCategories: [],
    disabledChannels: [],
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });
  readonly lastResult = signal('');
  readonly lastRecipe = signal<DocsPushRecipe>('severity');

  constructor() {
    // Handlers stay bound for the session so OS Review still works after leaving this page.
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
  }

  protected recipeAnchorId(recipe: DocsPushRecipe): string {
    return recipeAnchorId(recipe);
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

  /**
   * Upserts the inbox and shows an OS / system notification when permission allows and
   * preferences do not suppress the `push` channel.
   */
  async simulateSystemNotification(recipe: DocsPushRecipe = 'severity'): Promise<void> {
    this.lastRecipe.set(recipe);
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

  private demoPayload(recipe: DocsPushRecipe): PixelPushPayload {
    const nav = docsPushNav(recipe) as unknown as Readonly<Record<string, unknown>>;

    if (recipe === 'avatar') {
      return {
        notification: {
          id: DOCS_PUSH_DEMO_ID,
          title: 'Alex Chen',
          message: 'Can you review the travel request when you have a moment?',
          priority: 'high',
          severity: 'info',
          category: 'approvals',
          imageSrc: 'https://i.pravatar.cc/96?u=pixel-push-docs',
          actions: [
            { id: 'review', label: 'Review', nav },
            { id: 'later', label: 'Later' },
          ],
          data: { nav, recipe },
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
          id: DOCS_PUSH_DEMO_ID,
          title: 'Product update',
          message: 'New analytics dashboard is ready to explore.',
          priority: 'high',
          severity: 'success',
          category: 'billing',
          icon: 'campaign',
          actions: [
            { id: 'explore', label: 'Explore', nav },
            { id: 'later', label: 'Later' },
          ],
          data: { nav, recipe },
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
        id: DOCS_PUSH_DEMO_ID,
        title: 'High-priority approval',
        message: 'Travel request TR-104 needs your review (docs demo system notification).',
        priority: 'high',
        severity: 'warning',
        category: 'approvals',
        icon: 'warning',
        actions: [
          { id: 'review', label: 'Review', nav },
          { id: 'later', label: 'Later' },
        ],
        data: { nav, recipe },
      },
      push: {
        tag: DOCS_PUSH_DEMO_ID,
        leading: 'severity',
        renotify: true,
        requireInteraction: false,
      },
    };
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
