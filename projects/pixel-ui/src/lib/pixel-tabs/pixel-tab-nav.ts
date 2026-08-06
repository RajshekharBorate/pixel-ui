import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import PixelTabLinkComponent from './pixel-tab-link';
import PixelButtonComponent from '../pixel-button/pixel-button';
import { PIXEL_TAB_NAV } from './pixel-tab-nav.token';
import { prefersReducedMotion } from '../shared/overlay-utils';
import type { PixelTabsAlign, PixelTabsAppearance } from './pixel-tabs';

/**
 * Router-aware tab header. Pair it with a `<router-outlet>`: each projected `pixelTabLink` is a real
 * `routerLink`, so selecting a tab changes the URL, the active tab is derived from the URL (enabling
 * deep-links and browser back/forward), and the routed component is loaded by the router.
 *
 * Shares the look of `pixel-tabs` (underline / pill, sliding indicator, keyboard navigation, and
 * chevron scroll buttons when the tabs overflow) but sources its content from the router rather than
 * projected panels.
 *
 * @example
 * ```html
 * <pixel-tab-nav appearance="underline" ariaLabel="Sections">
 *   <a pixelTabLink routerLink="overview" icon="dashboard">Overview</a>
 *   <a pixelTabLink routerLink="activity">Activity</a>
 * </pixel-tab-nav>
 * <router-outlet />
 * ```
 */
@Component({
  selector: 'pixel-tab-nav',
  imports: [PixelButtonComponent],
  template: `
    <div
      class="pixel-tabs__bar"
      [class.pixel-tabs__bar--pill]="appearance() === 'pill'"
      [style.--pixel-tabs-duration]="durationCss()"
    >
      @if (overflowing()) {
        <pixel-button
          class="pixel-tabs__scroll pixel-tabs__scroll--start"
          appearance="mini-fab"
          size="sm"
          leadingIcon="chevron_left"
          [ariaLabel]="scrollBackwardAriaLabel()"
          [disabled]="!canScrollStart()"
          (click)="scrollByDirection(-1)"
        />
      }

      <div
        #header
        class="pixel-tabs__header"
        [class.pixel-tabs__header--center]="align() === 'center'"
        role="tablist"
        aria-orientation="horizontal"
        [attr.aria-label]="ariaLabel() || null"
        (keydown)="onKeydown($event)"
        (scroll)="updateScrollState()"
      >
        <ng-content />

        <span
          class="pixel-tabs__indicator"
          aria-hidden="true"
          [class.pixel-tabs__indicator--ready]="indicatorReady()"
          [style.width.px]="indicatorWidth()"
          [style.transform]="indicatorTransform()"
        ></span>
      </div>

      @if (overflowing()) {
        <pixel-button
          class="pixel-tabs__scroll pixel-tabs__scroll--end"
          appearance="mini-fab"
          size="sm"
          leadingIcon="chevron_right"
          [ariaLabel]="scrollForwardAriaLabel()"
          [disabled]="!canScrollEnd()"
          (click)="scrollByDirection(1)"
        />
      }
    </div>
  `,
  styleUrl: './pixel-tab-nav.scss',
  host: {
    class: 'pixel-tabs',
    '[class.pixel-tabs--no-animation]': '!animated()',
  },
  providers: [{ provide: PIXEL_TAB_NAV, useExisting: forwardRef(() => PixelTabNavComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTabNavComponent {
  /** Horizontal inset (px) applied to each side of the underline indicator. */
  private static readonly INDICATOR_INSET = 8;

  private readonly destroyRef = inject(DestroyRef);
  protected readonly links = contentChildren(PixelTabLinkComponent);
  private readonly headerRef = viewChild<ElementRef<HTMLElement>>('header');

  /** Header style. */
  readonly appearance = input<PixelTabsAppearance>('underline');

  /** Header alignment / distribution. */
  readonly align = input<PixelTabsAlign>('start');

  /** Enables the sliding active indicator (auto-disabled when the user prefers reduced motion). */
  readonly animated = input(true, { transform: booleanAttribute });

  /** Duration (ms) of the active-indicator slide. */
  readonly animationDuration = input(250, { transform: numberAttribute });

  /** Accessible label for the tablist. */
  readonly ariaLabel = input('');

  /**
   * Accessible name for the start overflow scroll control.
   *
   * @type {string}
   * @default 'Scroll tabs backward'
   */
  readonly scrollBackwardAriaLabel = input('Scroll tabs backward');

  /**
   * Accessible name for the end overflow scroll control.
   *
   * @type {string}
   * @default 'Scroll tabs forward'
   */
  readonly scrollForwardAriaLabel = input('Scroll tabs forward');

  protected readonly indicatorWidth = signal(0);
  protected readonly indicatorTransform = signal('translateX(0px)');
  protected readonly indicatorReady = signal(false);
  protected readonly overflowing = signal(false);
  protected readonly canScrollStart = signal(false);
  protected readonly canScrollEnd = signal(false);
  private readonly resizeTick = signal(0);
  private indicatorMeasured = false;

  protected readonly durationCss = computed(
    () => `${this.animated() ? this.animationDuration() : 0}ms`,
  );

  constructor() {
    // Position the sliding indicator under/behind the active link after each render, re-running when
    // the active link, appearance, link set, or header size changes.
    afterRenderEffect(() => {
      const links = this.links();
      const activeIndex = links.findIndex((link) => link.active());
      this.appearance();
      this.resizeTick();
      this.positionIndicator(links, activeIndex);
      this.updateScrollState();
    });

    afterNextRender(() => {
      this.observeResize();
      this.recomputeAfterFontsLoad();
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const links = this.links();
    if (!links.length) {
      return;
    }
    const current = Math.max(
      0,
      links.findIndex((link) => link.active()),
    );
    let next = current;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = this.nextEnabled(current, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = this.nextEnabled(current, -1);
        break;
      case 'Home':
        next = this.nextEnabled(-1, 1);
        break;
      case 'End':
        next = this.nextEnabled(links.length, -1);
        break;
      default:
        return;
    }

    // Roving focus: move focus to the target link. Activation (navigation) happens when the user
    // presses Enter/Space, which the anchor's routerLink handles natively.
    event.preventDefault();
    links[next]?.focus();
  }

  /** Scroll the header by ~70% of its width in the given direction (-1 backward, 1 forward). */
  protected scrollByDirection(direction: -1 | 1): void {
    const header = this.headerRef()?.nativeElement;
    if (!header) {
      return;
    }
    header.scrollBy({
      left: direction * header.clientWidth * 0.7,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  protected updateScrollState(): void {
    const header = this.headerRef()?.nativeElement;
    if (!header) {
      return;
    }
    const max = header.scrollWidth - header.clientWidth;
    this.overflowing.set(max > 1);
    this.canScrollStart.set(header.scrollLeft > 1);
    this.canScrollEnd.set(header.scrollLeft < max - 1);
  }

  private nextEnabled(from: number, step: number): number {
    const links = this.links();
    const count = links.length;
    let index = from;
    for (let i = 0; i < count; i++) {
      index = (index + step + count) % count;
      if (!links[index].disabled()) {
        return index;
      }
    }
    return Math.max(0, from);
  }

  private positionIndicator(links: readonly PixelTabLinkComponent[], index: number): void {
    const target = links[index]?.elementRef.nativeElement;
    const header = this.headerRef()?.nativeElement;
    if (!target || !header) {
      // No active link (e.g. URL doesn't match any tab): hide the indicator.
      this.indicatorWidth.set(0);
      return;
    }
    // Underline: inset the bar a fixed amount on each side. Pill: cover the full tab.
    const inset = this.appearance() === 'pill' ? 0 : PixelTabNavComponent.INDICATOR_INSET;
    this.indicatorWidth.set(Math.max(0, target.offsetWidth - inset * 2));
    this.indicatorTransform.set(`translateX(${target.offsetLeft + inset}px)`);
    this.scrollActiveIntoView(header, target);

    if (!this.indicatorMeasured) {
      // Commit the first position without a transition, then enable transitions on the next frame
      // so the indicator does not visibly slide in from the left on initial render.
      this.indicatorMeasured = true;
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => this.indicatorReady.set(true));
      } else {
        this.indicatorReady.set(true);
      }
    }
  }

  // Keep the active link visible when the header overflows, without scrolling the rest of the page.
  private scrollActiveIntoView(header: HTMLElement, target: HTMLElement): void {
    const left = target.offsetLeft;
    const right = left + target.offsetWidth;
    const margin = PixelTabNavComponent.INDICATOR_INSET;
    if (left < header.scrollLeft) {
      header.scrollLeft = Math.max(0, left - margin);
    } else if (right > header.scrollLeft + header.clientWidth) {
      header.scrollLeft = right - header.clientWidth + margin;
    }
  }

  private observeResize(): void {
    const header = this.headerRef()?.nativeElement;
    if (!header || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => this.resizeTick.update((tick) => tick + 1));
    observer.observe(header);
    for (const link of this.links()) {
      observer.observe(link.elementRef.nativeElement);
    }
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  // Material Symbols / fonts can load after the first measurement, changing link widths. Re-measure
  // once fonts are ready so the indicator matches the final layout.
  private recomputeAfterFontsLoad(): void {
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    fonts?.ready.then(() => this.resizeTick.update((tick) => tick + 1));
  }
}
