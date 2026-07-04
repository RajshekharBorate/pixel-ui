import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { PIXEL_TAB_NAV } from './pixel-tab-nav.token';

/**
 * A single link within `pixel-tab-nav`. Apply to an anchor alongside `routerLink`; the active state
 * is derived automatically from the current URL, so the matching tab highlights on navigation,
 * deep-links, and browser back/forward. Project the label as the anchor's content (rich content is
 * fine) and pass an optional leading `icon`.
 *
 * For non-router usage, bind `[active]` manually instead.
 *
 * @example
 * ```html
 * <pixel-tab-nav ariaLabel="Sections">
 *   <a pixelTabLink routerLink="overview" icon="dashboard">Overview</a>
 *   <a pixelTabLink routerLink="activity">Activity</a>
 * </pixel-tab-nav>
 * <router-outlet />
 * ```
 */
@Component({
  selector: 'a[pixelTabLink], button[pixelTabLink]',
  template: `
    @if (icon()) {
      <span class="pixel-tabs__tab-icon material-symbols-outlined" aria-hidden="true">{{
        icon()
      }}</span>
    }
    <span class="pixel-tabs__tab-label"><ng-content /></span>
  `,
  styleUrl: './pixel-tab-link.scss',
  host: {
    class: 'pixel-tabs__tab',
    role: 'tab',
    '[class.pixel-tabs__tab--active]': 'active()',
    '[class.pixel-tabs__tab--disabled]': 'disabled()',
    '[class.pixel-tabs__tab--pill]': 'pill()',
    '[class.pixel-tabs__tab--stretch]': 'stretch()',
    '[attr.aria-selected]': 'active()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-current]': 'active() ? "page" : null',
    '[attr.tabindex]': 'active() ? 0 : -1',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTabLinkComponent {
  /** Optional leading Material Symbols glyph in the link. */
  readonly icon = input('');

  /** Disables navigation/selection of this link. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Manual active override. Leave unset to derive active state from the host's `routerLink`; set it
   * for non-router usage.
   */
  readonly activeOverride = input<boolean | undefined>(undefined, { alias: 'active' });

  /**
   * When `true`, the link is active only on an exact URL match (like `routerLinkActiveOptions`'s
   * `exact`). Defaults to subset matching, so parent links stay active on child routes.
   */
  readonly exact = input(false, { transform: booleanAttribute });

  readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly routerLink = inject(RouterLink, { optional: true, self: true });
  private readonly router = inject(Router, { optional: true });
  private readonly nav = inject(PIXEL_TAB_NAV, { optional: true });

  private readonly routerActive = signal(false);

  /** Whether this link is currently active (manual override wins over the router-derived state). */
  readonly active = computed(() => this.activeOverride() ?? this.routerActive());

  // Mirror the parent nav's appearance / alignment so the link can style its own host (projected
  // content can't be reached by the nav's encapsulated styles).
  protected readonly pill = computed(() => this.nav?.appearance() === 'pill');
  protected readonly stretch = computed(() => this.nav?.align() === 'stretch');

  constructor() {
    if (this.router && this.routerLink) {
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          takeUntilDestroyed(),
        )
        .subscribe(() => this.updateRouterActive());
      // Compute the initial state after the routerLink inputs (and thus its urlTree) are resolved.
      afterNextRender(() => this.updateRouterActive());
    }
  }

  /** Move keyboard focus to this link. */
  focus(): void {
    this.elementRef.nativeElement.focus();
  }

  private updateRouterActive(): void {
    const tree = this.routerLink?.urlTree;
    this.routerActive.set(
      tree
        ? this.router!.isActive(tree, {
            paths: this.exact() ? 'exact' : 'subset',
            queryParams: this.exact() ? 'exact' : 'subset',
            fragment: 'ignored',
            matrixParams: 'ignored',
          })
        : false,
    );
  }
}
