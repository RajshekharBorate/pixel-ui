import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  groupNotifications,
  isPixelDarkTheme,
  type PixelBreadcrumbItem,
  type PixelNotification,
  type PixelNotificationAction,
  type PixelNotificationItemDensity,
  type PixelNotificationItemOverflowEvent,
  type PixelNotificationPanelCommandEvent,
  type PixelNotificationPanelFilter,
  type PixelNotificationTimestampMode,
  type PixelSelectOption,
  type PixelThemeId,
  PixelAppShellComponent,
  PixelAvatarComponent,
  PixelBadgeComponent,
  PixelBreadcrumbComponent,
  PixelButtonComponent,
  PixelContainerComponent,
  PixelDividerComponent,
  PixelFooterComponent,
  PixelHeaderComponent,
  PixelInputComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
  PixelNotificationItemComponent,
  PixelNotificationPanelComponent,
  PixelNotificationService,
  PixelPopoverComponent,
  PixelPopoverTriggerDirective,
  PixelSelectComponent,
  PixelSidenavComponent,
  PixelToastContainerComponent,
  PixelToggleComponent,
  PixelEmptyStateComponent,
} from 'pixel-ui';
import { ThemeService } from '../../../core/theme.service';

interface NavItem {
  readonly label: string;
  readonly icon: string;
}

interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

interface ActivityItem {
  readonly initials: string;
  readonly name: string;
  readonly action: string;
  readonly time: string;
}

interface TeamMember {
  readonly initials: string;
  readonly name: string;
  readonly role: string;
}

interface StatCard {
  readonly label: string;
  readonly value: string;
  readonly trend: string;
  readonly up: boolean;
}

type NotificationDemoSurface = 'panel' | 'list' | 'both';

/**
 * Full-page, chrome-less playground demonstrating every `pixel-ui` layout-shell component together
 * at real viewport scale: sticky header with a breadcrumb, a reflowing search field, a theme
 * toggle, a live notification center (badge + popover panel + toast bridge), and a user-profile
 * menu; a grouped, collapsible sidenav that shrinks to an icon rail (`collapseTo="rail"`) when
 * docked-and-closed and auto-becomes an overlay on narrow viewports; a genuinely scrollable main
 * content region; and a footer. Reached via the "Full-page demo" example on the pixel-app-shell
 * docs page (opens in a new tab) or directly at `/playground/app-shell`.
 */
@Component({
  selector: 'docs-app-shell-playground',
  imports: [
    PixelAppShellComponent,
    PixelAvatarComponent,
    PixelBadgeComponent,
    PixelBreadcrumbComponent,
    PixelButtonComponent,
    PixelContainerComponent,
    PixelDividerComponent,
    PixelEmptyStateComponent,
    PixelFooterComponent,
    PixelHeaderComponent,
    PixelInputComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
    PixelNotificationItemComponent,
    PixelNotificationPanelComponent,
    PixelPopoverComponent,
    PixelPopoverTriggerDirective,
    PixelSelectComponent,
    PixelSidenavComponent,
    PixelToastContainerComponent,
    PixelToggleComponent,
  ],
  templateUrl: './app-shell-playground.html',
  styleUrl: './app-shell-playground.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellPlaygroundComponent {
  private readonly themeService = inject(ThemeService);
  protected readonly notifications = inject(PixelNotificationService);
  private readonly notificationPopover = viewChild<PixelPopoverComponent>('notificationPopover');
  private readonly overflowMenu = viewChild<PixelMenuComponent>('notificationOverflowMenu');

  protected readonly sidenavOpen = signal(true);
  protected readonly activeLabel = signal('Overview');
  protected readonly searchQuery = signal('');
  protected readonly expandedGroups = signal<ReadonlySet<string>>(new Set(['General', 'Manage']));
  protected readonly panelFilter = signal<PixelNotificationPanelFilter>('all');
  protected readonly panelCategory = signal('');
  protected readonly overflowTarget = signal<PixelNotification | null>(null);
  protected readonly overflowHiddenActions = signal<readonly PixelNotificationAction[]>([]);

  /** Shared notification demo controls for the Notifications playground page (+ optional bell). */
  protected readonly demoSurface = signal<NotificationDemoSurface>('both');
  protected readonly demoApplyToBell = signal(true);
  protected readonly demoHeading = signal('Notifications');
  protected readonly demoPageSize = signal(5);
  protected readonly demoShowViewAll = signal(true);
  protected readonly demoViewAllLabel = signal('View Notification Center');
  protected readonly demoLoading = signal(false);
  protected readonly demoLoadingMore = signal(false);
  protected readonly demoHasMore = signal(false);
  protected readonly demoOffline = signal(false);
  protected readonly demoErrorMessage = signal('');
  protected readonly demoEmptyHeading = signal('No notifications');
  protected readonly demoEmptyDescription = signal('You are all caught up.');
  protected readonly demoItemDensity = signal<PixelNotificationItemDensity>('compact');
  protected readonly demoShowUnreadIndicator = signal(true);
  protected readonly demoShowActions = signal(true);
  protected readonly demoShowOverflow = signal(true);
  protected readonly demoShowDismiss = signal(false);
  protected readonly demoMaxInlineActions = signal(2);
  protected readonly demoTimestampMode = signal<PixelNotificationTimestampMode>('relative');
  protected readonly demoItemsDisabled = signal(false);
  protected readonly demoShowSkeleton = signal(false);

  protected readonly surfaceOptions: readonly PixelSelectOption[] = [
    { value: 'both', label: 'Panel + page list' },
    { value: 'panel', label: 'Panel only' },
    { value: 'list', label: 'Page list only' },
  ];
  protected readonly pageSizeOptions: readonly PixelSelectOption[] = [
    { value: 3, label: '3 (force Load more)' },
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
  ];
  protected readonly densityOptions: readonly PixelSelectOption[] = [
    { value: 'compact', label: 'Compact' },
    { value: 'default', label: 'Default' },
  ];
  protected readonly timestampOptions: readonly PixelSelectOption[] = [
    { value: 'relative', label: 'Relative' },
    { value: 'absolute', label: 'Absolute' },
  ];
  protected readonly maxActionsOptions: readonly PixelSelectOption[] = [
    { value: 0, label: '0 (overflow only)' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
  ];

  protected readonly notificationGroups = computed(() =>
    groupNotifications(this.notifications.inbox(), 'day'),
  );

  protected readonly breadcrumbItems = computed<PixelBreadcrumbItem[]>(() => [
    { label: 'Home' },
    { label: this.activeLabel(), active: true },
  ]);

  protected readonly themeId = this.themeService.themeId;
  protected readonly isDark = computed(() => isPixelDarkTheme(this.themeId()));

  protected readonly navGroups: readonly NavGroup[] = [
    {
      label: 'General',
      items: [
        { label: 'Overview', icon: 'dashboard' },
        { label: 'Analytics', icon: 'bar_chart' },
        { label: 'Reports', icon: 'description' },
        { label: 'Notifications', icon: 'notifications' },
      ],
    },
    {
      label: 'Manage',
      items: [
        { label: 'Customers', icon: 'group' },
        { label: 'Team', icon: 'badge' },
        { label: 'Settings', icon: 'settings' },
      ],
    },
  ];

  constructor() {
    this.seedDemoNotifications();
  }

  protected readonly stats: readonly StatCard[] = [
    { label: 'Revenue', value: '$48,290', trend: '+12.4%', up: true },
    { label: 'Active users', value: '3,182', trend: '+4.1%', up: true },
    { label: 'Open tickets', value: '27', trend: '-8.0%', up: false },
    { label: 'Conversion rate', value: '3.6%', trend: '+0.3pt', up: true },
  ];

  protected readonly activity: readonly ActivityItem[] = [
    { initials: 'AK', name: 'Ava Kim', action: 'closed ticket #4821', time: '2m ago' },
    { initials: 'DM', name: 'Diego Martins', action: 'updated the Q3 report', time: '14m ago' },
    { initials: 'PS', name: 'Priya Shah', action: 'invited a new teammate', time: '32m ago' },
    { initials: 'JL', name: 'Jonas Lindqvist', action: 'approved invoice #1092', time: '48m ago' },
    { initials: 'MR', name: 'Maria Rossi', action: 'commented on Customers', time: '1h ago' },
    { initials: 'TN', name: 'Tariq Noor', action: 'archived 3 tickets', time: '1h ago' },
    { initials: 'EW', name: 'Ellie Wong', action: 'updated billing details', time: '2h ago' },
    { initials: 'SB', name: 'Sam Becker', action: 'created a new report', time: '3h ago' },
    { initials: 'AK', name: 'Ava Kim', action: 'replied to a support thread', time: '4h ago' },
    { initials: 'DM', name: 'Diego Martins', action: 'exported analytics as CSV', time: '5h ago' },
    { initials: 'PS', name: 'Priya Shah', action: 'changed team permissions', time: '6h ago' },
    { initials: 'JL', name: 'Jonas Lindqvist', action: 'closed ticket #4790', time: '8h ago' },
  ];

  protected readonly team: readonly TeamMember[] = [
    { initials: 'AK', name: 'Ava Kim', role: 'Product Lead' },
    { initials: 'DM', name: 'Diego Martins', role: 'Engineering' },
    { initials: 'PS', name: 'Priya Shah', role: 'Design' },
    { initials: 'JL', name: 'Jonas Lindqvist', role: 'Finance' },
    { initials: 'MR', name: 'Maria Rossi', role: 'Support' },
    { initials: 'TN', name: 'Tariq Noor', role: 'Engineering' },
  ];

  protected selectNav(label: string): void {
    this.activeLabel.set(label);
  }

  protected isGroupExpanded(label: string): boolean {
    return this.expandedGroups().has(label);
  }

  protected toggleGroup(label: string): void {
    const next = new Set(this.expandedGroups());
    if (next.has(label)) {
      next.delete(label);
    } else {
      next.add(label);
    }
    this.expandedGroups.set(next);
  }

  protected toggleTheme(): void {
    const next: PixelThemeId = this.isDark() ? 'enterprise-light' : 'enterprise-dark';
    this.themeService.setTheme(next);
  }

  protected onPanelCommand(event: PixelNotificationPanelCommandEvent): void {
    if (event.command === 'mark-all-read') {
      this.notifications.markAllRead();
      return;
    }
    if (event.command === 'view-all') {
      this.openNotificationsPage();
      return;
    }
    if (event.command === 'load-more') {
      this.demoLoadingMore.set(true);
      window.setTimeout(() => {
        this.demoLoadingMore.set(false);
        this.demoHasMore.set(false);
        this.publishInboxDemo();
      }, 700);
      return;
    }
    if (event.command === 'retry') {
      this.demoErrorMessage.set('');
      this.demoLoading.set(true);
      window.setTimeout(() => this.demoLoading.set(false), 600);
    }
  }

  protected openNotificationsPage(): void {
    this.notificationPopover()?.close({ restoreFocus: false });
    this.activeLabel.set('Notifications');
    const next = new Set(this.expandedGroups());
    next.add('General');
    this.expandedGroups.set(next);
  }

  /** Overflow menus are for the full notifications page; the bell panel uses dismiss → archive. */
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
    if (!target) {
      return;
    }
    this.notifications.markRead(target.id);
  }

  protected markOverflowUnread(): void {
    const target = this.overflowTarget();
    if (!target) {
      return;
    }
    this.notifications.markUnread(target.id);
  }

  protected archiveOverflowTarget(): void {
    const target = this.overflowTarget();
    if (!target) {
      return;
    }
    this.notifications.archive(target.id);
  }

  protected invokeOverflowAction(actionId: string): void {
    const target = this.overflowTarget();
    if (!target) {
      return;
    }
    void this.notifications.invokeAction(target.id, actionId);
  }

  protected onDemoDismiss(item: PixelNotification): void {
    this.notifications.archive(item.id);
  }

  protected setDemoSurface(value: unknown): void {
    if (value === 'panel' || value === 'list' || value === 'both') {
      this.demoSurface.set(value);
    }
  }

  protected setDemoPageSize(value: unknown): void {
    const next = Number(value);
    if (Number.isFinite(next) && next > 0) {
      this.demoPageSize.set(next);
    }
  }

  protected setDemoDensity(value: unknown): void {
    if (value === 'compact' || value === 'default') {
      this.demoItemDensity.set(value);
    }
  }

  protected setDemoTimestampMode(value: unknown): void {
    if (value === 'relative' || value === 'absolute') {
      this.demoTimestampMode.set(value);
    }
  }

  protected setDemoMaxInlineActions(value: unknown): void {
    const next = Number(value);
    if (Number.isFinite(next) && next >= 0) {
      this.demoMaxInlineActions.set(next);
    }
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
    this.panelFilter.set('all');
    this.panelCategory.set('');
    this.demoLoading.set(false);
    this.demoLoadingMore.set(false);
    this.demoHasMore.set(false);
    this.demoOffline.set(false);
    this.demoErrorMessage.set('');
    this.demoShowSkeleton.set(false);
    this.seedDemoNotifications(true);
  }

  protected simulateEmptyInbox(): void {
    this.notifications.clear();
    this.demoLoading.set(false);
    this.demoErrorMessage.set('');
    this.demoShowSkeleton.set(false);
  }

  protected simulatePanelError(): void {
    this.demoErrorMessage.set('The notification service could not be reached.');
    this.demoLoading.set(false);
  }

  protected simulateInitialLoading(): void {
    this.demoShowSkeleton.set(false);
    this.demoLoading.set(true);
    this.demoErrorMessage.set('');
    window.setTimeout(() => this.demoLoading.set(false), 1200);
  }

  private seedDemoNotifications(force = false): void {
    const seed = (): void => {
      this.notifications.publishMany([
        {
          title: 'Invoice #1092 approved',
          message: 'Jonas Lindqvist approved the latest vendor invoice.',
          category: 'finance',
          severity: 'success',
          source: 'Finance',
          icon: 'payments',
          createdAt: Date.now() - 1000 * 60 * 12,
        },
        {
          title: 'Priya Shah commented',
          message: 'Left feedback on the Design workspace onboarding checklist.',
          category: 'team',
          severity: 'info',
          source: 'Directory',
          imageSrc: 'https://i.pravatar.cc/64?img=47',
          createdAt: Date.now() - 1000 * 60 * 28,
        },
        {
          title: 'New teammate invited',
          message: 'Priya Shah invited Sam Becker to the Design workspace.',
          category: 'team',
          severity: 'info',
          source: 'Directory',
          icon: 'group_add',
          createdAt: Date.now() - 1000 * 60 * 45,
        },
        {
          title: 'Security review recommended',
          message: 'Review recent sign-in activity from a new device.',
          category: 'security',
          severity: 'warning',
          source: 'Security',
          icon: 'shield',
          createdAt: Date.now() - 1000 * 60 * 90,
          actions: [{ id: 'review', label: 'Review', appearance: 'primary' }],
        },
      ]);
    };

    if (force || this.notifications.inbox().length === 0) {
      seed();
      return;
    }

    if (!this.notifications.inbox().some((item) => Boolean(item.imageSrc))) {
      this.notifications.publish({
        title: 'Priya Shah commented',
        message: 'Left feedback on the Design workspace onboarding checklist.',
        category: 'team',
        severity: 'info',
        source: 'Directory',
        imageSrc: 'https://i.pravatar.cc/64?img=47',
        createdAt: Date.now() - 1000 * 60 * 28,
      });
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
