import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import {
  isPixelDarkTheme,
  type PixelBreadcrumbItem,
  type PixelNotification,
  type PixelNotificationAction,
  type PixelNotificationPanelCommandEvent,
  type PixelThemeId,
  PixelAppShellComponent,
  PixelAvatarComponent,
  PixelBadgeComponent,
  PixelBreadcrumbComponent,
  PixelButtonComponent,
  PixelContainerComponent,
  PixelDialogRef,
  PixelDialogService,
  PixelDividerComponent,
  PixelFooterComponent,
  PixelHeaderComponent,
  PixelInputComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
  PixelNavigateService,
  PixelNotificationPanelComponent,
  PixelNotificationService,
  PixelNotificationSyncService,
  PixelPopoverComponent,
  PixelPopoverTriggerDirective,
  PixelSidenavComponent,
  PixelToastContainerComponent,
} from 'pixel-ui';
import { ThemeService } from '../../../core/theme.service';
import { AppShellPlaygroundDemoState } from './app-shell-playground-demo.state';
import { AppShellPlaygroundNavBridge } from './app-shell-playground-nav.bridge';
import { seedAppShellNavigateNotifications } from './app-shell-playground-nav.seed';
import {
  ClaimAmendmentDialogComponent,
  type ClaimAmendmentDialogData,
} from './claim-amendment-dialog';

interface NavItem {
  readonly label: string;
  readonly icon: string;
  /** Leaf route segment under `/playground/app-shell/`. */
  readonly path?: string;
  /** Nested expandable children (demo of multi-level sidenav). */
  readonly children?: readonly NavItem[];
}

interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

/** One icon row in the docked icon rail (derived from `navGroups`). */
interface RailNavEntry {
  readonly icon: string;
  readonly label: string;
  readonly path: string;
  /** Highlight when the route matches any of these (branch sections). */
  readonly activePaths?: readonly string[];
  readonly dividerBefore?: boolean;
}

/**
 * Full-page playground: app shell + routed pages + notification → PixelNavigateService deep links.
 */
@Component({
  selector: 'docs-app-shell-playground',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
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
    PixelNotificationPanelComponent,
    PixelPopoverComponent,
    PixelPopoverTriggerDirective,
    PixelSidenavComponent,
    PixelToastContainerComponent,
  ],
  providers: [AppShellPlaygroundNavBridge, AppShellPlaygroundDemoState],
  templateUrl: './app-shell-playground.html',
  styleUrl: './app-shell-playground.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellPlaygroundComponent {
  private readonly themeService = inject(ThemeService);
  private readonly navigate = inject(PixelNavigateService);
  private readonly dialog = inject(PixelDialogService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly notifications = inject(PixelNotificationService);
  private readonly notificationSync = inject(PixelNotificationSyncService);
  protected readonly demo = inject(AppShellPlaygroundDemoState);
  private readonly bridge = inject(AppShellPlaygroundNavBridge);

  private readonly notificationPopover = viewChild<PixelPopoverComponent>('notificationPopover');
  private readonly sidenav = viewChild(PixelSidenavComponent);

  protected readonly sidenavOpen = signal(true);
  /** True while sidenav effective mode is overlay (below autoCollapseBreakpoint). */
  protected readonly sidenavOverlay = computed(() => this.sidenav()?.effectiveMode() === 'over');
  /** True while docked sidenav is collapsed to the icon rail. */
  protected readonly sidenavRail = computed(() => {
    const nav = this.sidenav();
    return !!nav && nav.effectiveMode() === 'side' && !this.sidenavOpen() && nav.collapseTo() === 'rail';
  });
  protected readonly searchQuery = signal('');
  protected readonly expandedGroups = signal<ReadonlySet<string>>(
    new Set(['Workspace', 'Account', 'Operations', 'Admin', 'Support', 'Resources']),
  );
  protected readonly activePath = signal(this.pathFromUrl(this.router.url));

  private wizardRef: PixelDialogRef<void, ClaimAmendmentDialogComponent> | null = null;
  private readonly unsubscribers: Array<() => void> = [];

  protected readonly breadcrumbItems = computed<PixelBreadcrumbItem[]>(() => {
    const path = this.activePath();
    const label = this.findNavLabel(path) ?? 'Overview';
    return [{ label: 'Home' }, { label, active: true }];
  });

  protected readonly themeId = this.themeService.themeId;
  protected readonly isDark = computed(() => isPixelDarkTheme(this.themeId()));

  protected readonly navGroups: readonly NavGroup[] = [
    {
      label: 'Workspace',
      items: [
        { label: 'Overview', icon: 'dashboard', path: 'overview' },
        {
          label: 'Operations',
          icon: 'account_tree',
          children: [
            { label: 'Claims', icon: 'table_rows', path: 'claims' },
            { label: 'Billing', icon: 'payments', path: 'billing' },
          ],
        },
        { label: 'Notifications', icon: 'notifications', path: 'notifications' },
      ],
    },
    {
      label: 'Account',
      items: [
        {
          label: 'Admin',
          icon: 'admin_panel_settings',
          children: [{ label: 'Settings', icon: 'settings', path: 'settings' }],
        },
      ],
    },
    {
      label: 'Support',
      items: [
        {
          label: 'Resources',
          icon: 'menu_book',
          children: [
            { label: 'Help center', icon: 'help', path: 'overview' },
            { label: 'Product updates', icon: 'campaign', path: 'notifications' },
          ],
        },
      ],
    },
  ];

  /**
   * Flat icon rail: one row per top-level item; branches use their own icon and route to the
   * first child. Active state avoids duplicating top-level leaves (e.g. Notifications vs Resources).
   */
  protected readonly railNavEntries = computed(() => this.buildRailEntries());

  constructor() {
    // Multi-tab inbox fan-out (BroadcastChannel). Seed after start so publish uses stable ids
    // and subsequent markRead/archive sync across playground tabs.
    void this.notificationSync.start().then(() => {
      seedAppShellNavigateNotifications(this.notifications);
    });
    this.registerNavigateAdapters();
    this.navigate.setPermissionGuard(async (request) => {
      const route = request.route?.join('/') ?? '';
      if (route.includes('settings') || this.requestTargetsSettings(request)) {
        return this.bridge.settingsAllowed();
      }
      return true;
    });

    const sub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const path = this.pathFromUrl(event.urlAfterRedirects);
        this.activePath.set(path);
        this.ensureAncestorsExpanded(path);
      });
    this.destroyRef.onDestroy(() => sub.unsubscribe());

    void this.navigate.goFromUrl();
    this.ensureAncestorsExpanded(this.activePath());

    this.destroyRef.onDestroy(() => {
      for (const unsub of this.unsubscribers) {
        unsub();
      }
      this.notificationSync.stop();
      this.navigate.setPermissionGuard(null);
      this.wizardRef?.close();
    });
  }

  protected onActivateRoute(path: string | undefined): void {
    if (!path) {
      return;
    }
    this.activePath.set(path);
    this.ensureAncestorsExpanded(path);
    if (this.sidenavOverlay()) {
      this.sidenavOpen.set(false);
    }
  }

  private pathFromUrl(url: string): string {
    const match = /\/playground\/app-shell\/([^/?#]+)/.exec(url);
    return match?.[1] ?? 'overview';
  }

  protected isGroupExpanded(label: string): boolean {
    return this.expandedGroups().has(label);
  }

  /** Expanded sidenav panels only — rail uses a separate flat list. */
  protected isNavPanelOpen(label: string): boolean {
    return this.isGroupExpanded(label);
  }

  protected isRailEntryActive(entry: RailNavEntry): boolean {
    const path = this.activePath();
    if (entry.activePaths?.length) {
      return entry.activePaths.includes(path);
    }
    return entry.path === path;
  }

  private buildRailEntries(): readonly RailNavEntry[] {
    const topLevelLeafPaths = new Set(
      this.navGroups.flatMap((group) =>
        group.items.flatMap((item) => (item.path ? [item.path] : [])),
      ),
    );

    const entries: RailNavEntry[] = [];

    for (const [groupIndex, group] of this.navGroups.entries()) {
      for (const [itemIndex, item] of group.items.entries()) {
        const dividerBefore = itemIndex === 0 && groupIndex > 0;

        if (item.path) {
          entries.push({
            icon: item.icon,
            label: item.label,
            path: item.path,
            dividerBefore,
          });
          continue;
        }

        const children = item.children ?? [];
        const childPaths = children.flatMap((child) => (child.path ? [child.path] : []));
        if (childPaths.length === 0) {
          continue;
        }

        const activePaths = childPaths.filter((childPath) => !topLevelLeafPaths.has(childPath));

        entries.push({
          icon: item.icon,
          label: item.label,
          path: childPaths[0]!,
          activePaths: activePaths.length > 0 ? activePaths : undefined,
          dividerBefore,
        });
      }
    }

    return entries;
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

  private findNavLabel(path: string): string | undefined {
    for (const group of this.navGroups) {
      for (const item of group.items) {
        if (item.path === path) {
          return item.label;
        }
        const child = item.children?.find((c) => c.path === path);
        if (child) {
          return child.label;
        }
      }
    }
    return undefined;
  }

  private ensureAncestorsExpanded(path: string): void {
    const next = new Set(this.expandedGroups());
    for (const group of this.navGroups) {
      for (const item of group.items) {
        if (item.children?.some((c) => c.path === path)) {
          next.add(group.label);
          next.add(item.label);
        }
      }
    }
    this.expandedGroups.set(next);
  }

  protected toggleTheme(): void {
    const next: PixelThemeId = this.isDark() ? 'enterprise-light' : 'enterprise-dark';
    this.themeService.setTheme(next);
  }

  protected async onNotificationActivated(notification: PixelNotification): Promise<void> {
    this.notificationPopover()?.close({ restoreFocus: false });
    await this.navigate.openFromNotification(notification, {
      notifications: this.notifications,
      markRead: true,
    });
  }

  protected async onNotificationAction(
    notification: PixelNotification,
    action: PixelNotificationAction,
  ): Promise<void> {
    this.notificationPopover()?.close({ restoreFocus: false });
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
      this.notificationPopover()?.close({ restoreFocus: false });
      void this.navigate.go({
        route: ['/playground/app-shell/notifications'],
        onFailure: 'silent',
      });
      this.activePath.set('notifications');
      return;
    }
    if (event.command === 'load-more') {
      this.demo.demoLoadingMore.set(true);
      window.setTimeout(() => {
        this.demo.demoLoadingMore.set(false);
        this.demo.demoHasMore.set(false);
      }, 700);
      return;
    }
    if (event.command === 'retry') {
      this.demo.demoErrorMessage.set('');
      this.demo.demoLoading.set(true);
      window.setTimeout(() => this.demo.demoLoading.set(false), 600);
    }
  }

  private registerNavigateAdapters(): void {
    this.unsubscribers.push(
      this.navigate.registerGrid('claims', {
        revealRow: (rowId, options) => this.bridge.revealClaimRow(rowId, options),
      }),
    );
    this.unsubscribers.push(
      this.navigate.registerAdapter({
        id: 'settings',
        kind: 'tabs',
        activate: (target) => this.bridge.activateTabs(target),
      }),
    );
    this.unsubscribers.push(
      this.navigate.registerAdapter({
        id: 'help',
        kind: 'accordion',
        activate: (target) => this.bridge.activateAccordion(target),
      }),
    );
    this.unsubscribers.push(
      this.navigate.registerWizard({
        id: 'claim-amendment',
        syncUrl: true,
        open: async (ctx) => {
          if (!this.wizardRef) {
            this.wizardRef = this.dialog.open<
              ClaimAmendmentDialogComponent,
              ClaimAmendmentDialogData,
              void
            >(ClaimAmendmentDialogComponent, {
              title: 'Claim amendment',
              size: 'lg',
              data: { bridge: this.bridge, initialStep: ctx.step },
            });
            this.wizardRef.afterClosed().subscribe(() => {
              this.wizardRef = null;
              this.bridge.setWizardAdapter(null);
            });
          }
          const ready = await this.bridge.waitForWizard();
          if (!ready) {
            throw new Error('Claim amendment wizard failed to open');
          }
        },
        setStep: async (step) => this.bridge.setWizardStep(step),
        getStep: () => this.bridge.getWizardStep(),
        close: () => this.bridge.closeWizard(),
      }),
    );
  }

  private requestTargetsSettings(request: {
    readonly target?: unknown;
  }): boolean {
    const targets = Array.isArray(request.target)
      ? request.target
      : request.target
        ? [request.target]
        : [];
    return targets.some(
      (t) =>
        typeof t === 'object' &&
        t != null &&
        'id' in t &&
        (t as { id?: string }).id === 'security-review',
    );
  }
}
