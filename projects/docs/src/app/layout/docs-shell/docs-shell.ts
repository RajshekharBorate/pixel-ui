import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import {
  PixelBreadcrumbComponent,
  PixelButtonComponent,
  PixelDrawerComponent,
  PixelInputComponent,
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
  PixelToastContainerComponent,
  isPixelDarkTheme,
} from 'pixel-ui';
import { buildShellBreadcrumbs } from '../../core/doc-shell-breadcrumb.util';
import { DocNavigationService } from '../../core/doc-navigation.service';
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

  protected readonly mobileNavOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly componentsExpanded = signal(true);
  protected readonly chartsExpanded = signal(true);

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
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.mobileNavOpen.set(false));
  }

  protected isHomeActive(): boolean {
    return this.currentPath() === '/';
  }

  protected isComponentsCatalogActive(): boolean {
    return this.currentPath() === '/components';
  }

  protected isChartsCatalogActive(): boolean {
    return this.currentPath() === '/charts';
  }

  protected isComponentActive(componentId: string): boolean {
    return (
      this.currentPath().startsWith(`/components/${componentId}`) ||
      this.currentPath().startsWith(`/charts/${componentId}`)
    );
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
