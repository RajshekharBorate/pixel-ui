import { ChangeDetectionStrategy, Component, computed, inject, signal, afterNextRender } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import {
  PixelBreadcrumbComponent,
  PixelButtonComponent,
  PixelDrawerComponent,
  PixelInputComponent,
  PixelNavigateService,
  PixelPushNotificationService,
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
  PixelToastContainerComponent,
  isPixelDarkTheme,
} from 'pixel-ui';
import { buildShellBreadcrumbs } from '../../core/doc-shell-breadcrumb.util';
import { DocNavigationService } from '../../core/doc-navigation.service';
import { ensureDocsPixelPushServiceWorker } from '../../core/docs-push-sw';
import { ThemeService } from '../../core/theme.service';
import type { DocComponentMeta } from '../../registry/types';

@Component({
  selector: 'docs-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    PixelBreadcrumbComponent,
    PixelButtonComponent,
    PixelDrawerComponent,
    PixelInputComponent,
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
    PixelToastContainerComponent,
  ],
  templateUrl: './docs-shell.html',
  styleUrl: './docs-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsShellComponent {
  protected readonly nav = inject(DocNavigationService);
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly navigate = inject(PixelNavigateService);
  private readonly push = inject(PixelPushNotificationService);

  protected readonly mobileNavOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly componentsExpanded = signal(true);
  protected readonly chartsExpanded = signal(true);

  /** Avoid re-running the same cold-start / shareable `?nav=` payload twice. */
  private lastBootstrappedNavUrl = '';

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly currentPath = computed(() => this.normalizePath(this.currentUrl()));

  protected readonly breadcrumbItems = computed(() =>
    buildShellBreadcrumbs(this.currentUrl(), this.nav),
  );

  protected readonly filteredUiComponents = computed(() =>
    this.filterAndSort(this.nav.uiComponents),
  );

  protected readonly filteredChartComponents = computed(() =>
    this.filterAndSort(this.nav.chartComponents),
  );

  protected readonly componentsSectionExpanded = computed(
    () => this.searchQuery().trim().length > 0 || this.componentsExpanded(),
  );

  protected readonly chartsSectionExpanded = computed(
    () => this.searchQuery().trim().length > 0 || this.chartsExpanded(),
  );

  protected readonly isDarkTheme = computed(() => isPixelDarkTheme(this.themeService.themeId()));

  constructor() {
    // Keep the push bridge alive for the whole docs session (not just the examples page).
    this.push.start();
    void this.ensurePixelPushServiceWorker();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.mobileNavOpen.set(false);
        void this.bootstrapNavigateFromUrl();
      });

    afterNextRender(() => {
      void this.bootstrapNavigateFromUrl();
    });
  }

  private async ensurePixelPushServiceWorker(): Promise<void> {
    try {
      await ensureDocsPixelPushServiceWorker();
    } catch (error) {
      // Keep docs usable when SW is blocked; OS recipes will surface a clear error.
      console.warn('[docs] pixel push service worker:', error);
    }
  }

  /**
   * Cold-start / shareable deep links: when `?nav=` (or a fragment) is present, run
   * {@link PixelNavigateService.goFromUrl} so OS push openWindow and copied links scroll/highlight.
   */
  private async bootstrapNavigateFromUrl(): Promise<void> {
    if (typeof location === 'undefined') {
      return;
    }
    const raw = `${location.pathname}${location.search}${location.hash}`;
    const hasNav =
      new URLSearchParams(location.search).has('nav') || location.hash.length > 1;
    if (!hasNav || raw === this.lastBootstrappedNavUrl) {
      return;
    }
    this.lastBootstrappedNavUrl = raw;
    try {
      await this.navigate.goFromUrl(raw);
    } catch {
      /* soft-fail */
    }
  }

  protected isHomeActive(): boolean {
    return this.currentPath() === '/';
  }

  protected isPatternsActive(): boolean {
    return this.currentPath() === '/patterns';
  }

  protected isComponentsCatalogActive(): boolean {
    return this.currentPath() === '/components';
  }

  protected isChartsCatalogActive(): boolean {
    return this.currentPath() === '/charts';
  }

  protected isComponentActive(componentId: string): boolean {
    return this.pathMatchesComponent(this.currentPath(), '/components/', componentId)
      || this.pathMatchesComponent(this.currentPath(), '/charts/', componentId);
  }

  /** True when `path` is exactly the component route or a tab under it (not a prefix sibling). */
  private pathMatchesComponent(path: string, prefix: string, componentId: string): boolean {
    const base = `${prefix}${componentId}`;
    return path === base || path.startsWith(`${base}/`);
  }

  protected onDarkThemeToggle(dark: boolean): void {
    this.themeService.setTheme(dark ? 'enterprise-dark' : 'enterprise-light');
  }

  protected toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  protected toggleComponentsSection(): void {
    this.componentsExpanded.update((expanded) => !expanded);
  }

  protected toggleChartsSection(): void {
    this.chartsExpanded.update((expanded) => !expanded);
  }

  private filterAndSort(list: readonly DocComponentMeta[]): DocComponentMeta[] {
    const query = this.searchQuery().trim().toLowerCase();
    const filtered = !query
      ? list
      : list.filter(
          (component) =>
            component.title.toLowerCase().includes(query) ||
            component.id.toLowerCase().includes(query) ||
            component.selector.toLowerCase().includes(query),
        );
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  }

  private normalizePath(url: string): string {
    return url.split('?')[0]?.split('#')[0] ?? '/';
  }
}
