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
  readonly path: string;
}

interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
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
    new Set(['Workspace', 'Account']),
  );
  protected readonly activePath = signal(this.pathFromUrl(this.router.url));

  private wizardRef: PixelDialogRef<void, ClaimAmendmentDialogComponent> | null = null;
  private readonly unsubscribers: Array<() => void> = [];

  protected readonly breadcrumbItems = computed<PixelBreadcrumbItem[]>(() => {
    const path = this.activePath();
    const label =
      this.navGroups.flatMap((g) => g.items).find((item) => item.path === path)?.label ??
      'Overview';
    return [{ label: 'Home' }, { label, active: true }];
  });

  protected readonly themeId = this.themeService.themeId;
  protected readonly isDark = computed(() => isPixelDarkTheme(this.themeId()));

  protected readonly navGroups: readonly NavGroup[] = [
    {
      label: 'Workspace',
      items: [
        { label: 'Overview', icon: 'dashboard', path: 'overview' },
        { label: 'Claims', icon: 'table_rows', path: 'claims' },
        { label: 'Billing', icon: 'payments', path: 'billing' },
        { label: 'Notifications', icon: 'notifications', path: 'notifications' },
      ],
    },
    {
      label: 'Account',
      items: [{ label: 'Settings', icon: 'settings', path: 'settings' }],
    },
  ];

  constructor() {
    seedAppShellNavigateNotifications(this.notifications);
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
        this.activePath.set(this.pathFromUrl(event.urlAfterRedirects));
      });
    this.destroyRef.onDestroy(() => sub.unsubscribe());

    void this.navigate.goFromUrl();

    this.destroyRef.onDestroy(() => {
      for (const unsub of this.unsubscribers) {
        unsub();
      }
      this.navigate.setPermissionGuard(null);
      this.wizardRef?.close();
    });
  }

  protected onActivateRoute(path: string): void {
    this.activePath.set(path);
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
