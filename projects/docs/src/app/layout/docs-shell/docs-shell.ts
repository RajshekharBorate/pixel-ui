import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import {
  PixelBreadcrumbComponent,
  PixelButtonComponent,
  PixelDrawerComponent,
  PixelInputComponent,
  PixelSelectComponent,
  PixelToastContainerComponent,
  type PixelSelectOption,
  type PixelThemeId,
} from 'pixel-ui';
import { buildShellBreadcrumbs } from '../../core/doc-shell-breadcrumb.util';
import { DocNavigationService } from '../../core/doc-navigation.service';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'docs-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    PixelBreadcrumbComponent,
    PixelButtonComponent,
    PixelDrawerComponent,
    PixelInputComponent,
    PixelSelectComponent,
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

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url,
    },
  );

  protected readonly currentPath = computed(() => this.normalizePath(this.currentUrl()));

  protected readonly breadcrumbItems = computed(() =>
    buildShellBreadcrumbs(this.currentUrl(), this.nav),
  );

  protected readonly sortedFilteredComponents = computed(() =>
    [...this.filteredComponents()].sort((a, b) => a.title.localeCompare(b.title)),
  );

  protected readonly themeOptions: readonly PixelSelectOption[] = this.themeService.options.map(
    (option) => ({
      value: option.id,
      label: option.label,
    }),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.mobileNavOpen.set(false));
  }

  protected filteredComponents() {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.nav.components;
    }
    return this.nav.components.filter(
      (component) =>
        component.title.toLowerCase().includes(query) ||
        component.id.toLowerCase().includes(query) ||
        component.selector.toLowerCase().includes(query),
    );
  }

  protected isHomeActive(): boolean {
    return this.currentPath() === '/';
  }

  protected isCatalogActive(): boolean {
    return this.currentPath() === '/components';
  }

  protected isComponentActive(componentId: string): boolean {
    return this.currentPath().startsWith(`/components/${componentId}`);
  }

  protected onThemeChange(themeId: PixelThemeId | null): void {
    if (themeId) {
      this.themeService.setTheme(themeId);
    }
  }

  protected toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  private normalizePath(url: string): string {
    return url.split('?')[0]?.split('#')[0] ?? '/';
  }
}
