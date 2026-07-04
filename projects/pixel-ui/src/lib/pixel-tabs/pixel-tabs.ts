import { NgTemplateOutlet } from '@angular/common';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelBadgeComponent from '../pixel-badge/pixel-badge';
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
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import PixelTabComponent, { type PixelTabEnterDirection } from './pixel-tab';
import { prefersReducedMotion } from '../shared/overlay-utils';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

export type PixelTabsAppearance = 'underline' | 'pill';
export type PixelTabsAlign = 'start' | 'center' | 'stretch';

/**
 * Accessible tab group. Project `pixel-tab` children, each with a `label` (or a rich
 * `<ng-template pixelTabLabel>`). Two-way bind `selectedIndex`. Supports underline or pill
 * appearances, keyboard navigation (Arrow/Home/End, Delete to close), optional lazy panel rendering,
 * chevron scroll buttons when the header overflows, closable / addable tabs, and a smooth,
 * configurable active indicator + content transition.
 *
 * @example
 * ```html
 * <pixel-tabs [(selectedIndex)]="tab" appearance="underline" [animationDuration]="300">
 *   <pixel-tab label="Overview">…</pixel-tab>
 *   <pixel-tab label="Filters" icon="filter_list">…</pixel-tab>
 * </pixel-tabs>
 * ```
 */
@Component({
  selector: 'pixel-tabs',
  imports: [NgTemplateOutlet, PixelButtonComponent, PixelBadgeComponent, PixelSkeletonComponent],
  template: `
    @if (showSkeleton()) {
      <div class="pixel-tabs__skeleton" [class.pixel-tabs__skeleton--pill]="appearance() === 'pill'">
        @for (tab of skeletonTabArray(); track $index) {
          <pixel-skeleton
            class="pixel-tabs__skeleton-tab"
            shape="rounded"
            width="5rem"
            [height]="appearance() === 'pill' ? 'var(--pixel-tabs-pill-tab-height)' : 'var(--pixel-tabs-tab-height)'"
            [borderRadius]="appearance() === 'pill' ? 'var(--pixel-tabs-pill-tab-radius)' : ''"
          />
        }
      </div>
      @if (appearance() !== 'pill') {
        <div class="pixel-tabs__skeleton-divider"></div>
      }
    } @else {
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
          ariaLabel="Scroll tabs backward"
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
        @for (tab of tabs(); track tab.tabId; let i = $index) {
          <div
            #tabWrap
            class="pixel-tabs__tab-wrap"
            [class.pixel-tabs__tab-wrap--active]="i === selectedIndex()"
            [class.pixel-tabs__tab-wrap--stretch]="align() === 'stretch'"
          >
            <button
              type="button"
              class="pixel-tabs__tab"
              role="tab"
              [id]="tab.tabId"
              [class.pixel-tabs__tab--active]="i === selectedIndex()"
              [attr.aria-selected]="i === selectedIndex()"
              [attr.aria-controls]="tab.panelId"
              [attr.tabindex]="i === selectedIndex() ? 0 : -1"
              [disabled]="tab.disabled()"
              (click)="select(i)"
            >
              @if (tab.labelTemplate(); as labelTpl) {
                <ng-container [ngTemplateOutlet]="labelTpl.templateRef" />
              } @else {
                @if (tab.icon()) {
                  <span class="pixel-tabs__tab-icon material-symbols-outlined" aria-hidden="true">{{
                    tab.icon()
                  }}</span>
                }
                <span class="pixel-tabs__tab-label">{{ tab.label() }}</span>
                @if (tab.hasBadge()) {
                  <pixel-badge
                    class="pixel-tabs__tab-badge"
                    type="count"
                    size="sm"
                    position="inline"
                    [value]="tab.badge()"
                    [state]="tab.badgeState()"
                  />
                }
              }
            </button>

            @if (tab.closable()) {
              <button
                type="button"
                class="pixel-tabs__close"
                tabindex="-1"
                [attr.aria-label]="'Close ' + (tab.label() || 'tab')"
                [disabled]="tab.disabled()"
                (click)="closeTab(i, $event)"
              >
                <span class="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            }
          </div>
        }

        <span
          class="pixel-tabs__indicator"
          aria-hidden="true"
          [class.pixel-tabs__indicator--ready]="indicatorReady()"
          [style.width.px]="indicatorWidth()"
          [style.transform]="indicatorTransform()"
        ></span>
      </div>

      @if (addable()) {
        <pixel-button
          class="pixel-tabs__add"
          appearance="icon"
          size="sm"
          leadingIcon="add"
          [ariaLabel]="addLabel()"
          (click)="tabAdd.emit()"
        />
      }

      @if (overflowing()) {
        <pixel-button
          class="pixel-tabs__scroll pixel-tabs__scroll--end"
          appearance="mini-fab"
          size="sm"
          leadingIcon="chevron_right"
          ariaLabel="Scroll tabs forward"
          [disabled]="!canScrollEnd()"
          (click)="scrollByDirection(1)"
        />
      }
    </div>

    <div class="pixel-tabs__body">
      <ng-content />
    </div>
    }
  `,
  host: {
    class: 'pixel-tabs',
    '[class.pixel-tabs--no-animation]': '!animated()',
  },
  styleUrl: './pixel-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTabsComponent {
  /** Horizontal inset (px) applied to each side of the underline indicator. */
  private static readonly INDICATOR_INSET = 8;

  private readonly destroyRef = inject(DestroyRef);
  protected readonly tabs = contentChildren(PixelTabComponent);
  private readonly headerRef = viewChild<ElementRef<HTMLElement>>('header');
  private readonly tabWraps = viewChildren<ElementRef<HTMLElement>>('tabWrap');

  /** When true, replaces the tab bar with skeleton placeholders. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /** Number of skeleton tab pills. Defaults to the number of projected tabs, otherwise 3. */
  readonly skeletonCount = input(0, { transform: numberAttribute });

  /** Two-way selected tab index. */
  readonly selectedIndex = model(0);

  /** Header style. */
  readonly appearance = input<PixelTabsAppearance>('underline');

  /** Header alignment / distribution. */
  readonly align = input<PixelTabsAlign>('start');

  /** Defers panel rendering until first activation. */
  readonly lazy = input(false);

  /** Renders a trailing add (`+`) button that emits `tabAdd`. */
  readonly addable = input(false, { transform: booleanAttribute });

  /** Accessible label for the add button. */
  readonly addLabel = input('Add tab');

  /**
   * Enables the sliding active indicator and the panel content transition.
   *
   * @default true
   * @description Set to `false` to render state changes instantly (also auto-disabled when the
   * user prefers reduced motion).
   */
  readonly animated = input(true, { transform: booleanAttribute });

  /**
   * Duration (ms) of the active-indicator slide and the panel content transition.
   *
   * @default 250
   */
  readonly animationDuration = input(250, { transform: numberAttribute });

  /** Accessible label for the tablist. */
  readonly ariaLabel = input('');

  /** Emits the newly selected index on user change. */
  readonly selectedIndexChange = output<number>();

  /** Emits the index of a tab whose close affordance was used (click or Delete). */
  readonly tabClose = output<number>();

  /** Emits when the add (`+`) button is pressed. */
  readonly tabAdd = output<void>();

  protected readonly indicatorWidth = signal(0);
  protected readonly indicatorTransform = signal('translateX(0px)');
  protected readonly indicatorReady = signal(false);
  protected readonly overflowing = signal(false);
  protected readonly canScrollStart = signal(false);
  protected readonly canScrollEnd = signal(false);
  private readonly resizeTick = signal(0);
  private indicatorMeasured = false;
  private previousIndex = 0;

  protected readonly skeletonTabArray = computed(() => {
    const explicit = this.skeletonCount();
    return Array.from({ length: explicit > 0 ? explicit : (this.tabs().length || 3) });
  });

  protected readonly durationCss = computed(
    () => `${this.animated() ? this.animationDuration() : 0}ms`,
  );

  constructor() {
    // Keep each tab's active/lazy/animation state in sync with the selected index, and pass the
    // navigation direction so the entering panel slides the correct way.
    effect(() => {
      const index = this.selectedIndex();
      const lazy = this.lazy();
      const animated = this.animated();
      const duration = this.animationDuration();
      const direction: PixelTabEnterDirection = index >= this.previousIndex ? 'forward' : 'backward';
      this.tabs().forEach((tab, i) => {
        tab.setLazy(lazy);
        tab.setAnimation(animated, duration);
        tab.setActive(i === index, direction);
      });
      this.previousIndex = index;
    });

    // Position the sliding indicator under/behind the active tab after each render. Reads layout,
    // so it runs as an after-render effect and re-runs when the selection, appearance, tab set, or
    // header size changes.
    afterRenderEffect(() => {
      this.selectedIndex();
      this.appearance();
      this.resizeTick();
      this.positionIndicator(this.tabWraps(), this.selectedIndex());
      this.updateScrollState();
    });

    afterNextRender(() => {
      this.observeResize();
      this.recomputeAfterFontsLoad();
    });
  }

  select(index: number): void {
    const tab = this.tabs()[index];
    if (!tab || tab.disabled() || index === this.selectedIndex()) {
      return;
    }
    this.selectedIndex.set(index);
    this.selectedIndexChange.emit(index);
  }

  /** Select the next enabled tab, wrapping to the first after the last. */
  selectNext(): void {
    this.select(this.nextEnabled(this.selectedIndex(), 1));
  }

  /** Select the previous enabled tab, wrapping to the last before the first. */
  selectPrevious(): void {
    this.select(this.nextEnabled(this.selectedIndex(), -1));
  }

  protected closeTab(index: number, event: Event): void {
    event.stopPropagation();
    const tab = this.tabs()[index];
    if (!tab || tab.disabled()) {
      return;
    }
    this.tabClose.emit(index);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const tabs = this.tabs();
    if (!tabs.length) {
      return;
    }
    const current = this.selectedIndex();

    if ((event.key === 'Delete' || event.key === 'Backspace') && tabs[current]?.closable()) {
      event.preventDefault();
      this.closeTab(current, event);
      return;
    }

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
        next = this.nextEnabled(tabs.length, -1);
        break;
      default:
        return;
    }

    event.preventDefault();
    this.select(next);
    document.getElementById(tabs[next]?.tabId)?.focus();
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
    const tabs = this.tabs();
    const count = tabs.length;
    let index = from;
    for (let i = 0; i < count; i++) {
      index = (index + step + count) % count;
      if (!tabs[index].disabled()) {
        return index;
      }
    }
    return Math.max(0, from);
  }

  private positionIndicator(wraps: readonly ElementRef<HTMLElement>[], index: number): void {
    const target = wraps[index]?.nativeElement;
    if (!target) {
      return;
    }
    // Underline: inset the bar a fixed amount on each side so it reads as a consistent treatment
    // under the label. Pill: cover the full tab so the filled background aligns with its shape.
    const inset = this.appearance() === 'pill' ? 0 : PixelTabsComponent.INDICATOR_INSET;
    this.indicatorWidth.set(Math.max(0, target.offsetWidth - inset * 2));
    this.indicatorTransform.set(`translateX(${target.offsetLeft + inset}px)`);

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

  private observeResize(): void {
    const header = this.headerRef()?.nativeElement;
    if (!header || typeof ResizeObserver === 'undefined') {
      return;
    }
    // Observe the header and every tab so the indicator re-measures whether the container resizes or
    // an individual tab reflows (e.g. its label/icon changes width).
    const observer = new ResizeObserver(() => this.resizeTick.update((tick) => tick + 1));
    observer.observe(header);
    for (const wrap of this.tabWraps()) {
      observer.observe(wrap.nativeElement);
    }
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  // Tab labels/icons (Material Symbols) can load after the first measurement, changing tab widths.
  // Re-measure once fonts are ready so the indicator matches the final layout.
  private recomputeAfterFontsLoad(): void {
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    fonts?.ready.then(() => this.resizeTick.update((tick) => tick + 1));
  }
}
