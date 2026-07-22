import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  PixelBadgeComponent,
  PixelButtonComponent,
  PixelNotificationPanelComponent,
  PixelNotificationService,
  PixelPopoverComponent,
  PixelPopoverTriggerDirective,
  PixelToastContainerComponent,
  type PixelNotificationPanelCommandEvent,
  type PixelNotificationPanelFilter,
} from 'pixel-ui';

@Component({
  selector: 'docs-notification-core-example',
  imports: [
    PixelButtonComponent,
    PixelBadgeComponent,
    PixelNotificationPanelComponent,
    PixelPopoverComponent,
    PixelPopoverTriggerDirective,
    PixelToastContainerComponent,
  ],
  template: `
    <pixel-toast-container />

    <div class="notification-demo__toolbar">
      <pixel-button appearance="outline" (click)="publishNormal()">Add inbox item</pixel-button>
      <pixel-button appearance="outline" (click)="publishHigh()">Add high priority</pixel-button>
      <pixel-button appearance="outline" (click)="publishCritical()">Add critical</pixel-button>
      <pixel-button appearance="text" (click)="notifications.markAllRead()">
        Mark all read
      </pixel-button>

      <pixel-badge
        class="notification-demo__bell"
        type="notification"
        size="sm"
        [value]="notifications.unreadCount()"
        [showZero]="false"
        ariaLabel="Unread notifications"
      >
        <pixel-button
          appearance="icon"
          fabShape="square"
          leadingIcon="notifications"
          [ariaLabel]="'Notifications, ' + notifications.unreadCount() + ' unread'"
          [pixelPopoverTriggerFor]="notificationPopover"
        />
      </pixel-badge>
    </div>

    <pixel-popover
      #notificationPopover
      align="end"
      panelWidth="26rem"
      ariaLabel="Notification center"
    >
      <pixel-notification-panel
        [notifications]="notifications.inbox()"
        [filter]="panelFilter()"
        (filterChange)="panelFilter.set($event)"
        [category]="panelCategory()"
        (categoryChange)="panelCategory.set($event)"
        (notificationActivated)="notifications.markRead($event.notification.id)"
        (actionClicked)="notifications.invokeAction($event.notification.id, $event.action.id)"
        (dismissClicked)="notifications.archive($event.notification.id)"
        (command)="onPanelCommand($event)"
      />
    </pixel-popover>

    <p aria-live="polite">
      {{ notifications.unreadCount() }} unread · {{ notifications.inbox().length }} in inbox
    </p>

    <p class="notification-demo__hint">
      Use the bell to open the desktop notification panel. Close (×) archives an item; use a full
      notifications page for detailed overflow actions.
    </p>
  `,
  styles: `
    :host { display: block; }
    .notification-demo__toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--pixel-sys-space-sm, 0.5rem);
    }
    .notification-demo__bell {
      margin-inline-start: auto;
    }
    .notification-demo__hint {
      color: var(--pixel-sys-on-surface-variant, #44474f);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCoreExample {
  protected readonly notifications = inject(PixelNotificationService);
  protected readonly panelFilter = signal<PixelNotificationPanelFilter>('all');
  protected readonly panelCategory = signal('');

  protected publishNormal(): void {
    this.notifications.publish({
      title: 'Monthly report is ready',
      message: 'Open Reports to download it.',
      category: 'reports',
      severity: 'success',
      dedupeKey: 'report:monthly',
    });
  }

  protected publishHigh(): void {
    this.notifications.publish({
      title: 'Approval required',
      message: 'Travel request TR-104 is waiting.',
      category: 'approvals',
      severity: 'warning',
      priority: 'high',
      dedupeKey: 'approval:TR-104',
      actions: [{ id: 'review', label: 'Review', appearance: 'primary' }],
    });
  }

  protected publishCritical(): void {
    this.notifications.publish({
      title: 'Unrecognized sign-in blocked',
      message: 'Review recent security activity.',
      category: 'security',
      severity: 'error',
      priority: 'critical',
      dedupeKey: 'security:sign-in',
    });
  }

  protected onPanelCommand(event: PixelNotificationPanelCommandEvent): void {
    if (event.command === 'mark-all-read') {
      this.notifications.markAllRead();
    }
  }
}
