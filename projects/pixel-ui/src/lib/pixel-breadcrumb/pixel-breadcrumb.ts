import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import PixelBadgeComponent from '../pixel-badge/pixel-badge';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuItemComponent from '../pixel-menu/pixel-menu-item';
import PixelMenuTriggerDirective from '../pixel-menu/pixel-menu-trigger';
import PixelBreadcrumbItemComponent from './pixel-breadcrumb-item';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import { PixelBreadcrumbService } from './pixel-breadcrumb.service';
import { PIXEL_BREAKPOINT_PX } from '../shared/breakpoints';
import { prefersReducedMotion } from '../shared/overlay-utils';
import type {
  PixelBreadcrumbClickEvent,
  PixelBreadcrumbInteractionSource,
  PixelBreadcrumbItem,
  PixelBreadcrumbOverflowMode,
  PixelBreadcrumbSize,
  PixelBreadcrumbType,
  PixelBreadcrumbVariant,
  PixelBreadcrumbViewItem,
} from './pixel-breadcrumb.types';

export type {
  PixelBreadcrumbClickEvent,
  PixelBreadcrumbInteractionSource,
  PixelBreadcrumbItem,
  PixelBreadcrumbLink,
  PixelBreadcrumbOverflowMode,
  PixelBreadcrumbSize,
  PixelBreadcrumbType,
  PixelBreadcrumbVariant,
  PixelBreadcrumbViewItem,
} from './pixel-breadcrumb.types';

let nextBreadcrumbId = 0;

/** Default visible-node count when auto-collapsing on narrow / overflowing layouts. */
const AUTO_COLLAPSE_MAX = 3;
/** Floor for width-tightened collapse (home + current). */
const WIDTH_COLLAPSE_MIN = 2;
/** Extra free space (px) required before releasing a width-based collapse step. */
const WIDTH_COLLAPSE_HYSTERESIS_PX = 48;

/**
 * Enterprise-grade, accessible, themeable breadcrumb navigation.
 *
 * Renders a semantic `<nav><ol>` trail that is fully data-driven: pass a strongly typed
 * {@link PixelBreadcrumbItem} array via `[items]`, author nodes declaratively with
 * `<pixel-breadcrumb-item>`, or let it auto-generate from the Angular Router (`routeDriven` /
 * {@link PixelBreadcrumbService}). Supports icons, custom separators, badges, tooltips, smart
 * overflow collapsing with an interactive dropdown, multi-level hierarchies, sizes, variants, and
 * light / dark theming. State is driven entirely by signals; the public API uses `input()` /
 * `output()` only — no two-way binding.
 *
 * @example
 * ```html
 * <!-- Static, data-driven -->
 * <pixel-breadcrumb [items]="trail" />
 *
 * <!-- Declarative with icons + overflow dropdown -->
 * <pixel-breadcrumb [maxVisibleItems]="4" overflowMode="dropdown" separatorIcon="chevron_right">
 *   <pixel-breadcrumb-item label="Home" link="/" icon="home" />
 *   <pixel-breadcrumb-item label="Products" link="/products" />
 *   <pixel-breadcrumb-item label="Laptops" active />
 * </pixel-breadcrumb>
 *
 * <!-- Auto-generated from the router -->
 * <pixel-breadcrumb routeDriven showHomeIcon />
 * ```
 */
@Component({
  selector: 'pixel-breadcrumb',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    PixelBadgeComponent,
    PixelButtonComponent,
    PixelTooltipDirective,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
    PixelSkeletonComponent,
  ],
  templateUrl: './pixel-breadcrumb.html',
  styleUrl: './pixel-breadcrumb.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-breadcrumb',
    '[class]': 'hostClass()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-type]': 'type()',
    '[attr.data-variant]': 'variant()',
  },
})
export default class PixelBreadcrumbComponent {
  private readonly fallbackId = `pixel-breadcrumb-${++nextBreadcrumbId}`;
  private readonly breadcrumbService = inject(PixelBreadcrumbService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly overflowTriggerRef = viewChild<ElementRef<HTMLElement>>('overflowTrigger');
  private readonly overflowMenu = viewChild<PixelMenuComponent>('overflowMenu');
  private readonly scrollerRef = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly listRef = viewChild<ElementRef<HTMLElement>>('list');

  /** Declarative `<pixel-breadcrumb-item>` children, used when `[items]` is not supplied. */
  protected readonly projected = contentChildren(PixelBreadcrumbItemComponent);

  // ---- Inputs ----

  /**
   * @component The breadcrumb trail. When provided, this is the source of truth (ignores projected
   * items and the router). Use immutable arrays — replace, don't mutate.
   * @type {readonly PixelBreadcrumbItem[] | null}
   * @default null
   */
  /** When true, replaces the breadcrumb trail with skeleton pill placeholders. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /** Number of skeleton breadcrumb items. Defaults to items array length, otherwise 3. */
  readonly skeletonCount = input(0, { transform: numberAttribute });

  readonly items = input<readonly PixelBreadcrumbItem[] | null>(null);

  /**
   * @component Visual / behavioural preset.
   * @type {PixelBreadcrumbType}
   * @default 'default'
   */
  readonly type = input<PixelBreadcrumbType>('default');

  /**
   * @component Density scale.
   * @type {PixelBreadcrumbSize}
   * @default 'md'
   */
  readonly size = input<PixelBreadcrumbSize>('md');

  /**
   * @component Surface treatment of the container and its links.
   * @type {PixelBreadcrumbVariant}
   * @default 'minimal'
   */
  readonly variant = input<PixelBreadcrumbVariant>('minimal');

  /**
   * @component Separator text rendered between nodes (ignored when `separatorIcon` is set or a
   * `separatorTemplate` is supplied).
   * @type {string}
   * @default '/'
   */
  readonly separator = input('/');

  /**
   * @component Material Symbols glyph used as the separator (e.g. `chevron_right`). Takes precedence
   * over `separator`.
   * @type {string}
   * @default ''
   */
  readonly separatorIcon = input('');

  /**
   * @component Custom separator template. Overrides both `separator` and `separatorIcon`.
   * @type {TemplateRef<unknown> | null}
   * @default null
   */
  readonly separatorTemplate = input<TemplateRef<unknown> | null>(null);

  /**
   * @component Custom per-item template. Receives `{ $implicit: item, index, isLast }`.
   * @type {TemplateRef<{ $implicit: PixelBreadcrumbViewItem; index: number; isLast: boolean }> | null}
   * @default null
   */
  readonly itemTemplate = input<TemplateRef<{
    $implicit: PixelBreadcrumbViewItem;
    index: number;
    isLast: boolean;
  }> | null>(null);

  /**
   * @component Renders the first node with a home glyph (`homeIcon`) even if the item has no icon.
   * @type {boolean}
   * @default false
   */
  readonly showHomeIcon = input(false, { transform: booleanAttribute });

  /**
   * @component Material Symbols glyph used for the home node when `showHomeIcon` is on.
   * @type {string}
   * @default 'home'
   */
  readonly homeIcon = input('home');

  /**
   * @component Max number of nodes shown before the trail collapses. `0` disables collapsing.
   * @type {number}
   * @default 0
   */
  readonly maxVisibleItems = input(0, { transform: numberAttribute });

  /**
   * @component Number of leading nodes kept visible when collapsed.
   * @type {number}
   * @default 1
   */
  readonly itemsBeforeCollapse = input(1, { transform: numberAttribute });

  /**
   * @component Number of trailing nodes kept visible when collapsed. `0` derives it from
   * `maxVisibleItems` so the total visible count equals `maxVisibleItems`.
   * @type {number}
   * @default 0
   */
  readonly itemsAfterCollapse = input(0, { transform: numberAttribute });

  /**
   * @component Whether collapsing is allowed at all (master switch).
   * @type {boolean}
   * @default true
   */
  readonly collapsible = input(true, { transform: booleanAttribute });

  /**
   * @component How collapsed middle nodes are presented: an interactive `dropdown` or a static
   * `ellipsis`. `type="collapsed"` forces `ellipsis`; `type="dropdown"` forces `dropdown`.
   * @type {PixelBreadcrumbOverflowMode}
   * @default 'dropdown'
   */
  readonly overflowMode = input<PixelBreadcrumbOverflowMode>('dropdown');

  /**
   * @component Whether nodes are interactive (links / buttons). When `false`, the whole trail is
   * read-only text.
   * @type {boolean}
   * @default true
   */
  readonly clickable = input(true, { transform: booleanAttribute });

  /**
   * @component Renders the last (current-page) node as a link when it has one. By default the
   * current node is plain `aria-current` text.
   * @type {boolean}
   * @default false
   */
  readonly showLastAsLink = input(false, { transform: booleanAttribute });

  /**
   * @component Hides node labels, showing icons only (labels stay available to screen readers).
   * Implied by `type="icon-only"`.
   * @type {boolean}
   * @default false
   */
  readonly iconOnly = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-breadcrumb
   * Enables responsive overflow handling.
   * @type {boolean}
   * @default true
   * @description On narrow viewports (and when the trail is wider than its container) the middle
   * collapses into a dropdown, density steps down one size, labels truncate more tightly, and
   * the current page stays scrolled into view. Set `false` to opt out. Ignored when
   * `overflowMode="scroll"`.
   */
  readonly responsive = input(true, { transform: booleanAttribute });

  /**
   * @component Shows item tooltips on hover / focus.
   * @type {boolean}
   * @default true
   */
  readonly tooltips = input(true, { transform: booleanAttribute });

  /**
   * @component Forwards `[queryParamsHandling]="'preserve'"` to router links so the current query
   * string survives navigation.
   * @type {boolean}
   * @default false
   */
  readonly preserveQueryParams = input(false, { transform: booleanAttribute });

  /**
   * @component Sources the trail from {@link PixelBreadcrumbService} (router-generated). Implied by
   * `type="route-driven"`. Ignored when `[items]` or projected items are supplied.
   * @type {boolean}
   * @default false
   */
  readonly routeDriven = input(false, { transform: booleanAttribute });

  /**
   * @component Accessible label for the `<nav>` landmark.
   * @type {string}
   * @default 'Breadcrumb'
   */
  readonly ariaLabel = input('Breadcrumb');

  /**
   * @component Accessible label for the overflow trigger.
   * @type {string}
   * @default 'Show collapsed breadcrumbs'
   */
  readonly overflowAriaLabel = input('Show collapsed breadcrumbs');

  /**
   * @type {string}
   * @default 'more items'
   * @description Suffix for the visually-hidden overflow count (`N more items`).
   */
  readonly overflowMoreItemsLabel = input('more items');

  /**
   * Accessible name for the start scroll chevron (`overflowStrategy: 'scroll'`).
   *
   * @type {string}
   * @default 'Scroll breadcrumbs backward'
   */
  readonly scrollBackwardAriaLabel = input('Scroll breadcrumbs backward');

  /**
   * Accessible name for the end scroll chevron (`overflowStrategy: 'scroll'`).
   *
   * @type {string}
   * @default 'Scroll breadcrumbs forward'
   */
  readonly scrollForwardAriaLabel = input('Scroll breadcrumbs forward');

  /**
   * @component Enables fade / slide entrance animations (auto-disabled under reduced-motion).
   * @type {boolean}
   * @default true
   */
  readonly animated = input(true, { transform: booleanAttribute });

  /**
   * @component Extra static classes appended to the host.
   * @type {string}
   * @default ''
   */
  readonly className = input('');

  // ---- Outputs ----

  /** Emitted when a node is activated (mouse or keyboard). Carries the item, index, and source. */
  readonly itemClick = output<PixelBreadcrumbClickEvent>();
  /** Emitted when the overflow dropdown opens (`true`) or closes (`false`). */
  readonly overflowToggle = output<boolean>();

  // ---- Derived source ----

  protected readonly skeletonItemArray = computed(() => {
    const explicit = this.skeletonCount();
    const fromItems = this.items()?.length ?? 0;
    return Array.from({ length: explicit > 0 ? explicit : (fromItems || 3) });
  });

  /** Staggered widths so the skeleton visually mimics labels of varying length. */
  protected skeletonItemWidth(index: number, total: number): string {
    // First item (e.g. "Home") is short; last (active page) is longer; middle items moderate.
    if (total === 1) return '5rem';
    if (index === 0) return '3rem';
    if (index === total - 1) return '5rem';
    const cycle = ['4.5rem', '5.5rem', '4rem'];
    return cycle[(index - 1) % cycle.length];
  }

  protected readonly isRouteDriven = computed(
    () => this.routeDriven() || this.type() === 'route-driven',
  );

  /** Resolved trail from the active source (input → projected → router). */
  protected readonly sourceItems = computed<readonly PixelBreadcrumbItem[]>(() => {
    const explicit = this.items();
    if (explicit) {
      return explicit;
    }
    const projected = this.projected();
    if (projected.length) {
      return projected.map((item) => item.snapshot());
    }
    if (this.isRouteDriven()) {
      return this.breadcrumbService.items();
    }
    return [];
  });

  protected readonly resolvedIconOnly = computed(
    () => this.iconOnly() || this.type() === 'icon-only',
  );

  /** Full trail normalised into render-ready view items. */
  protected readonly viewItems = computed<readonly PixelBreadcrumbViewItem[]>(() => {
    const source = this.sourceItems();
    const count = source.length;
    const clickable = this.clickable();
    const showLastAsLink = this.showLastAsLink();
    const showHome = this.showHomeIcon();
    const homeIcon = this.homeIcon();
    return source.map((item, index) => {
      const isLast = index === count - 1;
      const hasTarget = item.link != null || !!item.href;
      const currentPage = item.active ?? isLast;
      const interactive =
        clickable &&
        !item.disabled &&
        (!currentPage || (showLastAsLink && hasTarget)) &&
        (hasTarget || clickable);
      return {
        ...item,
        icon: showHome && index === 0 && !item.icon ? homeIcon : item.icon,
        index,
        key: item.id ?? `${index}:${item.label}`,
        isLast,
        interactive,
      };
    });
  });

  protected readonly itemCount = computed(() => this.viewItems().length);

  /**
   * Viewport is below the `sm` breakpoint — used for Phase 1 mobile auto-collapse and density step-down.
   */
  readonly narrowViewport = signal(false);

  /**
   * Width-based visible-count cap (Phase 2). `null` means no width override; otherwise the trail
   * may show at most this many nodes (tightened until the list fits the host).
   */
  private readonly widthMaxVisible = signal<number | null>(null);

  /**
   * Count-based collapse threshold before width tightening: explicit `maxVisibleItems`, type
   * presets, or mobile auto (`3`) when `responsive` + narrow and the consumer left max at `0`.
   */
  private readonly countBasedMax = computed(() => {
    if (this.scrollMode() || !this.collapsible()) {
      return 0;
    }
    const max = Math.floor(this.maxVisibleItems());
    if (max > 0) {
      return max;
    }
    if (this.type() === 'collapsed' || this.type() === 'dropdown') {
      return 4;
    }
    if (this.responsive() && this.narrowViewport()) {
      return AUTO_COLLAPSE_MAX;
    }
    return 0;
  });

  /** Effective collapse threshold after applying width-based tightening. */
  private readonly effectiveMax = computed(() => {
    if (this.scrollMode() || !this.collapsible()) {
      return 0;
    }
    const base = this.countBasedMax();
    const widthCap = this.widthMaxVisible();
    if (widthCap != null) {
      return base > 0 ? Math.min(base, widthCap) : widthCap;
    }
    return base;
  });

  /** Density used for rendering — steps down one size on narrow viewports when `responsive`. */
  protected readonly resolvedSize = computed<PixelBreadcrumbSize>(() => {
    const size = this.size();
    if (!this.responsive() || !this.narrowViewport()) {
      return size;
    }
    if (size === 'lg') {
      return 'md';
    }
    if (size === 'md') {
      return 'sm';
    }
    return size;
  });

  protected readonly resolvedOverflowMode = computed<PixelBreadcrumbOverflowMode>(() => {
    if (this.type() === 'collapsed') {
      return 'ellipsis';
    }
    if (this.type() === 'dropdown') {
      return 'dropdown';
    }
    return this.overflowMode();
  });

  /**
   * Scroll strategy: keep the whole trail and scroll it horizontally with chevron buttons (like
   * `pixel-tab-nav`) instead of collapsing middle items.
   */
  protected readonly scrollMode = computed(() => this.resolvedOverflowMode() === 'scroll');

  /** Whether the trail is currently folded into an overflow indicator (never in scroll mode). */
  readonly collapsed = computed(() => {
    if (this.scrollMode()) {
      return false;
    }
    const max = this.effectiveMax();
    return this.collapsible() && max > 0 && this.itemCount() > max;
  });

  private readonly collapseBounds = computed(() => {
    const total = this.itemCount();
    const max = this.effectiveMax();
    const before = Math.max(0, Math.min(this.itemsBeforeCollapse(), max - 1));
    const afterInput = this.itemsAfterCollapse();
    const after = Math.max(1, afterInput > 0 ? afterInput : max - before);
    // Guard against overlap when inputs over-reach the trail length.
    const safeAfter = Math.min(after, total - before - 1);
    return { before, after: Math.max(1, safeAfter) };
  });

  protected readonly leadingItems = computed<readonly PixelBreadcrumbViewItem[]>(() => {
    if (!this.collapsed()) {
      return this.viewItems();
    }
    return this.viewItems().slice(0, this.collapseBounds().before);
  });

  protected readonly trailingItems = computed<readonly PixelBreadcrumbViewItem[]>(() => {
    if (!this.collapsed()) {
      return [];
    }
    const total = this.itemCount();
    return this.viewItems().slice(total - this.collapseBounds().after);
  });

  protected readonly overflowItems = computed<readonly PixelBreadcrumbViewItem[]>(() => {
    if (!this.collapsed()) {
      return [];
    }
    const { before, after } = this.collapseBounds();
    return this.viewItems().slice(before, this.itemCount() - after);
  });

  protected readonly resolvedId = computed(() => this.fallbackId);

  protected readonly animateOn = computed(() => this.animated() && !prefersReducedMotion());

  protected readonly hostClass = computed(() => {
    const classes = ['pixel-breadcrumb'];
    if (this.resolvedIconOnly()) {
      classes.push('pixel-breadcrumb--icon-only');
    }
    if (this.responsive()) {
      classes.push('pixel-breadcrumb--responsive');
    }
    if (this.narrowViewport()) {
      classes.push('pixel-breadcrumb--narrow');
    }
    if (this.collapsed()) {
      classes.push('pixel-breadcrumb--collapsed');
    }
    if (this.scrollMode()) {
      classes.push('pixel-breadcrumb--scroll');
    }
    if (this.animateOn()) {
      classes.push('pixel-breadcrumb--animated');
    }
    const custom = this.className().trim();
    if (custom) {
      classes.push(custom);
    }
    return classes.join(' ');
  });

  // ---- Scroll-overflow state (scroll mode) ----

  /** True when the scrollable track is wider than its container (chevrons shown). */
  protected readonly overflowing = signal(false);
  /** Whether there is more content to reveal to the start / end. */
  protected readonly canScrollStart = signal(false);
  protected readonly canScrollEnd = signal(false);
  /** Bumped by the ResizeObserver so the scroll-state effect re-runs on layout changes. */
  private readonly resizeTick = signal(0);
  private scrollObserver: ResizeObserver | null = null;

  constructor() {
    // Phase 1 — narrow viewport via matchMedia (`sm`).
    effect((onCleanup) => {
      if (!this.responsive() || this.scrollMode()) {
        this.narrowViewport.set(false);
        return;
      }
      if (typeof matchMedia !== 'function') {
        this.narrowViewport.set(false);
        return;
      }
      const mql = matchMedia(`(max-width: ${PIXEL_BREAKPOINT_PX.sm - 1}px)`);
      const update = (): void => this.narrowViewport.set(mql.matches);
      update();
      mql.addEventListener('change', update);
      onCleanup(() => mql.removeEventListener('change', update));
    });

    // Phase 2 — width-based collapse: tighten visible count until the list fits the host.
    effect((onCleanup) => {
      if (!this.responsive() || this.scrollMode() || !this.collapsible()) {
        this.widthMaxVisible.set(null);
        return;
      }
      // Re-run when trail / density / count inputs change.
      this.viewItems();
      this.maxVisibleItems();
      this.size();
      this.resolvedSize();
      this.narrowViewport();
      this.type();
      this.itemsBeforeCollapse();
      this.itemsAfterCollapse();

      const host = this.hostRef.nativeElement;
      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const measure = (): void => this.updateWidthCollapse(host);
      measure();
      const frame = requestAnimationFrame(measure);
      const ro = new ResizeObserver(measure);
      ro.observe(host);
      onCleanup(() => {
        cancelAnimationFrame(frame);
        ro.disconnect();
      });
    });

    // Recompute the scroll affordances after each render when the trail or layout changes. Also
    // lazily wires the ResizeObserver the first time the scroller appears (so it works even when
    // scroll mode is switched on at runtime).
    afterRenderEffect(() => {
      if (this.scrollMode()) {
        this.viewItems();
        this.resizeTick();
        this.observeScroller();
        this.updateScrollState();
        return;
      }

      // Phase 1 safety: keep the current page in view if the list still scrolls horizontally.
      if (!this.responsive()) {
        return;
      }
      this.leadingItems();
      this.trailingItems();
      this.collapsed();
      const list = this.listRef()?.nativeElement;
      const current = list?.querySelector('.pixel-breadcrumb__current') as HTMLElement | null;
      if (current && list && list.scrollWidth > list.clientWidth + 1) {
        current.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });

    afterNextRender(() => {
      // Re-measure once web fonts settle (Material Symbols can change item widths after paint).
      document.fonts?.ready.then(() => {
        this.resizeTick.update((tick) => tick + 1);
        this.updateWidthCollapse(this.hostRef.nativeElement);
      });
    });

    this.destroyRef.onDestroy(() => this.scrollObserver?.disconnect());
  }

  /**
   * Compare list `scrollWidth` to available width and tighten / release `widthMaxVisible`.
   * Uses hysteresis when releasing so collapse does not oscillate.
   */
  private updateWidthCollapse(host: HTMLElement): void {
    if (!this.responsive() || this.scrollMode() || !this.collapsible()) {
      this.widthMaxVisible.set(null);
      return;
    }

    const total = this.itemCount();
    if (total <= WIDTH_COLLAPSE_MIN) {
      this.widthMaxVisible.set(null);
      return;
    }

    const list =
      this.listRef()?.nativeElement ??
      (host.querySelector('.pixel-breadcrumb__list') as HTMLElement | null);
    if (!list) {
      return;
    }

    const available = list.clientWidth || host.clientWidth;
    if (available <= 0) {
      return;
    }

    const overflowing = list.scrollWidth > available + 1;
    const base = this.countBasedMax();
    const cap = this.widthMaxVisible();
    const currentMax = cap != null ? (base > 0 ? Math.min(base, cap) : cap) : base;

    if (overflowing) {
      if (currentMax === 0) {
        this.widthMaxVisible.set(Math.min(AUTO_COLLAPSE_MAX, total - 1));
      } else if (currentMax > WIDTH_COLLAPSE_MIN) {
        this.widthMaxVisible.set(currentMax - 1);
      }
      return;
    }

    // Fits — release width cap gradually when there is clear spare space.
    if (cap == null) {
      return;
    }
    if (list.scrollWidth >= available - WIDTH_COLLAPSE_HYSTERESIS_PX) {
      return;
    }

    const releaseTarget = base > 0 ? base : total;
    if (cap >= releaseTarget) {
      this.widthMaxVisible.set(null);
      return;
    }
    const next = cap + 1;
    if (next >= releaseTarget) {
      this.widthMaxVisible.set(null);
    } else {
      this.widthMaxVisible.set(next);
    }
  }

  // ---- Separator helpers ----

  protected readonly hasSeparatorIcon = computed(() => this.separatorIcon().trim().length > 0);

  /** Tooltip text for a node: explicit tooltip, or the label when icon-only, else none. */
  protected tooltipText(item: PixelBreadcrumbViewItem): string {
    if (!this.tooltips()) {
      return '';
    }
    if (item.tooltip) {
      return item.tooltip;
    }
    return this.resolvedIconOnly() && !!item.icon ? item.label : '';
  }

  // ---- Interaction ----

  protected onItemActivate(
    item: PixelBreadcrumbViewItem,
    event: MouseEvent | KeyboardEvent,
    source: PixelBreadcrumbInteractionSource,
    fromOverflow: boolean,
  ): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    this.itemClick.emit({
      item,
      index: item.index,
      isLast: item.isLast,
      fromOverflow,
      source,
      originalEvent: event,
    });
  }

  protected onItemKeydown(item: PixelBreadcrumbViewItem, event: KeyboardEvent): void {
    // Plain anchors / buttons handle Enter natively; only synthesise activation for non-anchor
    // buttons reached via Space, and emit the analytics event for keyboard activations.
    if (event.key === 'Enter' || event.key === ' ') {
      const isButton = !item.link && !item.href;
      if (isButton) {
        event.preventDefault();
        this.onItemActivate(item, event, 'keyboard', false);
      } else if (event.key === 'Enter') {
        this.onItemActivate(item, event, 'keyboard', false);
      }
    }
  }

  /** Activation of an overflow dropdown row. Navigation is handled natively by the menu-item link. */
  protected onOverflowItemSelected(
    item: PixelBreadcrumbViewItem,
    event: MouseEvent | KeyboardEvent,
  ): void {
    this.onItemActivate(
      item,
      event,
      event instanceof KeyboardEvent ? 'keyboard' : 'mouse',
      true,
    );
  }

  /** Toggle the overflow dropdown open / closed (programmatic control). */
  toggleOverflow(): void {
    this.overflowMenu()?.opened() ? this.closeOverflow() : this.openOverflow();
  }

  /** Open the overflow dropdown (delegates to the underlying `pixel-menu`). */
  openOverflow(): void {
    const trigger = this.overflowTriggerRef()?.nativeElement;
    const menu = this.overflowMenu();
    if (trigger && menu) {
      menu.open(trigger, null);
    }
  }

  /** Close the overflow dropdown. */
  closeOverflow(): void {
    this.overflowMenu()?.close();
  }

  // ---- Scroll overflow (scroll mode) ----

  /** Scroll the track by ~70% of its width in the given direction (-1 backward, 1 forward). */
  protected scrollByDirection(direction: -1 | 1): void {
    const scroller = this.scrollerRef()?.nativeElement;
    if (!scroller) {
      return;
    }
    scroller.scrollBy({
      left: direction * scroller.clientWidth * 0.7,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  /** Recompute the overflow / can-scroll flags from the track's scroll metrics. */
  protected updateScrollState(): void {
    const scroller = this.scrollerRef()?.nativeElement;
    if (!scroller) {
      this.overflowing.set(false);
      return;
    }
    const max = scroller.scrollWidth - scroller.clientWidth;
    this.overflowing.set(max > 1);
    this.canScrollStart.set(scroller.scrollLeft > 1);
    this.canScrollEnd.set(scroller.scrollLeft < max - 1);
  }

  /** Attach a ResizeObserver to the scroll track once it exists (idempotent). */
  private observeScroller(): void {
    if (this.scrollObserver) {
      return;
    }
    const scroller = this.scrollerRef()?.nativeElement;
    if (!scroller || typeof ResizeObserver === 'undefined') {
      return;
    }
    this.scrollObserver = new ResizeObserver(() => this.resizeTick.update((tick) => tick + 1));
    this.scrollObserver.observe(scroller);
  }
}
