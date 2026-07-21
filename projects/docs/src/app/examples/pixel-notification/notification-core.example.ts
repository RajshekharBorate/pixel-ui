import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import {
  PixelBadgeComponent,
  PixelButtonComponent,
  PixelDividerComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelNotificationPanelComponent,
  PixelNotificationService,
  PixelPopoverComponent,
  PixelPopoverTriggerDirective,
  PixelToastContainerComponent,
  type PixelNotification,
  type PixelNotificationAction,
  type PixelNotificationItemOverflowEvent,
  type PixelNotificationPanelCommandEvent,
  type PixelNotificationPanelFilter,
} from 'pixel-ui';

@Component({
  selector: 'docs-notification-core-example',
  imports: [
    PixelButtonComponent,
    PixelBadgeComponent,
    PixelDividerComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
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
        (overflowClicked)="onOverflowClicked($event)"
        (command)="onPanelCommand($event)"
      />
    </pixel-popover>

    <pixel-menu #overflowMenu ariaLabel="Notification actions" xPosition="before">
      @if (overflowTarget(); as target) {
        @if (target.readAt === null) {
          <pixel-menu-item icon="mark_email_read" (selected)="markOverflowRead()">
            Mark as read
          </pixel-menu-item>
        } @else {
          <pixel-menu-item icon="mark_email_unread" (selected)="markOverflowUnread()">
            Mark as unread
          </pixel-menu-item>
        }
        @for (action of overflowHiddenActions(); track action.id) {
          <pixel-menu-item (selected)="invokeOverflowAction(action.id)">
            {{ action.label }}
          </pixel-menu-item>
        }
        <pixel-divider />
        <pixel-menu-item icon="archive" variant="danger" (selected)="archiveOverflowTarget()">
          Archive
        </pixel-menu-item>
      }
    </pixel-menu>

    <p aria-live="polite">
      {{ notifications.unreadCount() }} unread · {{ notifications.inbox().length }} in inbox
    </p>

    <p class="notification-demo__hint">
      Use the bell to open the desktop notification panel. The ⋮ control opens an actions menu.
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
  private readonly overflowMenu = viewChild<PixelMenuComponent>('overflowMenu');
  protected readonly panelFilter = signal<PixelNotificationPanelFilter>('all');
  protected readonly panelCategory = signal('');
  protected readonly overflowTarget = signal<PixelNotification | null>(null);
  protected readonly overflowHiddenActions = signal<readonly PixelNotificationAction[]>([]);

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

  protected onOverflowClicked(event: PixelNotificationItemOverflowEvent): void {
    this.overflowTarget.set(event.notification);
    this.overflowHiddenActions.set(event.hiddenActions);
    const trigger = resolveOverflowTrigger(event.originalEvent);
    if (!trigger) {
      return;
    }
    this.overflowMenu()?.open(trigger);
  }

  protected markOverflowRead(): void {
    const target = this.overflowTarget();
    if (target) {
      this.notifications.markRead(target.id);
    }
  }

  protected markOverflowUnread(): void {
    const target = this.overflowTarget();
    if (target) {
      this.notifications.markUnread(target.id);
    }
  }

  protected archiveOverflowTarget(): void {
    const target = this.overflowTarget();
    if (target) {
      this.notifications.archive(target.id);
    }
  }

  protected invokeOverflowAction(actionId: string): void {
    const target = this.overflowTarget();
    if (target) {
      void this.notifications.invokeAction(target.id, actionId);
    }
  }
}

function resolveOverflowTrigger(event: MouseEvent | KeyboardEvent): HTMLElement | null {
  const current = event.currentTarget;
  if (current instanceof HTMLElement) {
    return current;
  }
  const target = event.target;
  if (!(target instanceof Element)) {
    return null;
  }
  return target.closest('button, [role="button"]');
}
