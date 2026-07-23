import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  groupNotifications,
  type PixelNotification,
  type PixelNotificationAction,
  type PixelNotificationItemOverflowEvent,
  type PixelNotificationPanelCommandEvent,
  PixelButtonComponent,
  PixelDividerComponent,
  PixelEmptyStateComponent,
  PixelInputComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelNavigateService,
  PixelNotificationItemComponent,
  PixelNotificationPanelComponent,
  PixelNotificationService,
  PixelSelectComponent,
  PixelToggleComponent,
} from 'pixel-ui';
import { AppShellPlaygroundDemoState } from '../app-shell-playground-demo.state';
import { seedAppShellNavigateNotifications } from '../app-shell-playground-nav.seed';

@Component({
  selector: 'docs-app-shell-notifications-page',
  imports: [
    PixelButtonComponent,
    PixelDividerComponent,
    PixelEmptyStateComponent,
    PixelInputComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelNotificationItemComponent,
    PixelNotificationPanelComponent,
    PixelSelectComponent,
    PixelToggleComponent,
  ],
  templateUrl: './notifications.page.html',
  styleUrl: '../playground-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellNotificationsPage {
  protected readonly notifications = inject(PixelNotificationService);
  protected readonly demo = inject(AppShellPlaygroundDemoState);
  private readonly navigate = inject(PixelNavigateService);
  private readonly router = inject(Router);
  private readonly overflowMenu = viewChild<PixelMenuComponent>('notificationOverflowMenu');

  protected readonly overflowTarget = signal<PixelNotification | null>(null);
  protected readonly overflowHiddenActions = signal<readonly PixelNotificationAction[]>([]);

  protected readonly notificationGroups = computed(() =>
    groupNotifications(this.notifications.inbox(), 'day'),
  );

  protected async onActivate(notification: PixelNotification): Promise<void> {
    await this.navigate.openFromNotification(notification, {
      notifications: this.notifications,
      markRead: true,
    });
  }

  protected async onAction(notification: PixelNotification, actionId: string): Promise<void> {
    const action = notification.actions.find((entry) => entry.id === actionId);
    await this.navigate.openFromNotification(notification, {
      action,
      notifications: this.notifications,
      markRead: true,
    });
  }

  protected onPanelCommand(event: PixelNotificationPanelCommandEvent): void {
    if (event.command === 'mark-all-read') {
      this.notifications.markAllRead();
      return;
    }
    if (event.command === 'view-all') {
      void this.router.navigateByUrl('/playground/app-shell/notifications');
      return;
    }
    if (event.command === 'load-more') {
      this.demo.demoLoadingMore.set(true);
      window.setTimeout(() => {
        this.demo.demoLoadingMore.set(false);
        this.demo.demoHasMore.set(false);
        this.publishInboxDemo();
      }, 700);
      return;
    }
    if (event.command === 'retry') {
      this.demo.demoErrorMessage.set('');
      this.demo.demoLoading.set(true);
      window.setTimeout(() => this.demo.demoLoading.set(false), 600);
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

  protected onDemoDismiss(item: PixelNotification): void {
    this.notifications.archive(item.id);
  }

  protected publishInboxDemo(): void {
    this.notifications.publish({
      title: 'Weekly digest is ready',
      message: 'Open Reports to review the summary.',
      category: 'reports',
      severity: 'success',
      source: 'Acme Reports',
      icon: 'description',
    });
  }

  protected publishHighDemo(): void {
    this.notifications.publish({
      title: 'Approval required',
      message: 'Travel request TR-104 is waiting for review.',
      category: 'approvals',
      severity: 'warning',
      priority: 'high',
      source: 'Workflow',
      icon: 'approval',
      actions: [
        { id: 'review', label: 'Review', appearance: 'primary' },
        { id: 'later', label: 'Later' },
      ],
    });
  }

  protected publishAvatarDemo(): void {
    this.notifications.publish({
      title: 'Priya Shah mentioned you',
      message: 'Can you review the onboarding checklist before Friday?',
      category: 'team',
      severity: 'info',
      source: 'Directory',
      imageSrc: 'https://i.pravatar.cc/64?img=47',
      actions: [{ id: 'open', label: 'Open thread', appearance: 'primary' }],
    });
  }

  protected publishProgressDemo(): void {
    this.notifications.publish({
      title: 'Exporting customer report',
      message: 'This may take a minute for large workspaces.',
      category: 'jobs',
      severity: 'info',
      source: 'Jobs',
      icon: 'cloud_download',
      state: 'loading',
      progress: 42,
    });
  }

  protected publishFailedDemo(): void {
    this.notifications.publish({
      title: 'Export failed',
      message: 'The report could not be generated. Try again.',
      category: 'jobs',
      severity: 'error',
      source: 'Jobs',
      icon: 'error',
      state: 'failed',
      actions: [
        { id: 'retry', label: 'Retry', appearance: 'primary' },
        { id: 'details', label: 'Details' },
        { id: 'support', label: 'Contact support' },
      ],
    });
  }

  protected publishRepeatDemo(): void {
    this.notifications.publish({
      title: 'Build finished',
      message: 'pixel-ui docs build completed successfully.',
      category: 'jobs',
      severity: 'success',
      source: 'CI',
      icon: 'check_circle',
      dedupeKey: 'demo-build-finished',
    });
  }

  protected resetDemoInbox(): void {
    this.notifications.clear();
    this.demo.panelFilter.set('all');
    this.demo.panelCategory.set('');
    this.demo.demoLoading.set(false);
    this.demo.demoLoadingMore.set(false);
    this.demo.demoHasMore.set(false);
    this.demo.demoOffline.set(false);
    this.demo.demoErrorMessage.set('');
    this.demo.demoShowSkeleton.set(false);
    seedAppShellNavigateNotifications(this.notifications, true);
  }

  protected simulateEmptyInbox(): void {
    this.notifications.clear();
    this.demo.demoLoading.set(false);
    this.demo.demoErrorMessage.set('');
    this.demo.demoShowSkeleton.set(false);
  }

  protected simulatePanelError(): void {
    this.demo.demoErrorMessage.set('The notification service could not be reached.');
    this.demo.demoLoading.set(false);
  }

  protected simulateInitialLoading(): void {
    this.demo.demoShowSkeleton.set(false);
    this.demo.demoLoading.set(true);
    this.demo.demoErrorMessage.set('');
    window.setTimeout(() => this.demo.demoLoading.set(false), 1200);
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
