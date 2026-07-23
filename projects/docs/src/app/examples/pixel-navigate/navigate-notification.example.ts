import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  PixelButtonComponent,
  PixelNavAnchorDirective,
  PixelNavigateService,
  PixelNotificationItemComponent,
  PixelNotificationService,
  type PixelNotification,
} from 'pixel-ui';

@Component({
  selector: 'docs-navigate-notification-example',
  imports: [PixelButtonComponent, PixelNotificationItemComponent, PixelNavAnchorDirective],
  template: `
    <p class="hint">
      Notifications carry <code>data.nav</code> (and optional <code>action.nav</code>). Activation
      uses <code>openFromNotification</code> — mark read + navigate, no auto-wiring by default.
    </p>
    <div class="actions">
      <pixel-button appearance="outline" leadingIcon="notifications" (click)="republish()">
        Reset sample notification
      </pixel-button>
    </div>

    @if (item(); as notification) {
      <pixel-notification-item
        [notification]="notification"
        density="compact"
        (activated)="onActivated(notification)"
        (actionClicked)="onAction(notification, $event.action.id)"
      />
    }

    <div class="spacer" aria-hidden="true"></div>
    <section class="panel" pixelNavAnchor="claim-docs" id="claim-docs">
      <h3>Claim documents</h3>
      <p>Target reached from the notification deep link.</p>
    </section>

    @if (status()) {
      <p class="info">{{ status() }}</p>
    }
  `,
  styles: `
    .hint,
    .info {
      margin: 0 0 0.75rem;
      color: var(--pixel-sys-on-surface-variant, #444);
      font-size: 0.875rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-end: 1rem;
    }
    .spacer {
      block-size: 12vh;
    }
    .panel {
      padding: 1rem;
      border: 1px solid var(--pixel-sys-outline-variant, #ccc);
      border-radius: 0.5rem;
      background: var(--pixel-sys-surface, #fff);
    }
    .panel h3 {
      margin: 0 0 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigateNotificationExample implements OnInit {
  private readonly navigate = inject(PixelNavigateService);
  private readonly notifications = inject(PixelNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly item = signal<PixelNotification | null>(null);
  readonly status = signal('');

  ngOnInit(): void {
    this.republish();
    this.destroyRef.onDestroy(() => {
      const current = this.item();
      if (current) {
        this.notifications.remove(current.id);
      }
    });
  }

  republish(): void {
    const existing = this.item();
    if (existing) {
      this.notifications.remove(existing.id);
    }
    const id = this.notifications.publish({
      title: 'Documents ready for review',
      message: 'Travel request TR-104 needs your sign-off.',
      category: 'approvals',
      severity: 'warning',
      priority: 'high',
      source: 'Workflow',
      data: {
        nav: {
          target: { type: 'section', id: 'claim-docs' },
        },
      },
      actions: [
        {
          id: 'review',
          label: 'Review',
          appearance: 'primary',
          nav: { target: { type: 'section', id: 'claim-docs' } },
        },
      ],
    });
    this.item.set(this.notifications.get(id));
    this.status.set('Sample notification published with data.nav.');
  }

  async onActivated(notification: PixelNotification): Promise<void> {
    const result = await this.navigate.openFromNotification(notification, {
      notifications: this.notifications,
      markRead: true,
    });
    this.item.set(this.notifications.get(notification.id));
    this.status.set(
      result?.ok ? 'Opened from notification activate.' : result?.message ?? 'No nav payload',
    );
  }

  async onAction(notification: PixelNotification, actionId: string): Promise<void> {
    const action = notification.actions.find((entry) => entry.id === actionId);
    const result = await this.navigate.openFromNotification(notification, {
      action,
      notifications: this.notifications,
      markRead: true,
    });
    this.item.set(this.notifications.get(notification.id));
    this.status.set(
      result?.ok ? `Opened from action “${actionId}”.` : result?.message ?? 'No nav payload',
    );
  }
}
