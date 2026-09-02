import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelSelectComponent from '../pixel-select/pixel-select';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import {
  PIXEL_UI_ANALYTICS,
  emitPixelUiAnalytics,
} from '../shared/analytics/pixel-ui-analytics';
import type { PixelSelectOption } from '../pixel-select/pixel-select';

// ── Public types ───────────────────────────────────────────────────────────────

/** Visual variant controlling how much chrome is shown. */
export type PixelPaginatorVariant = 'default' | 'minimal';

/** Density scale. */
export type PixelPaginatorSize = 'xs' | 'sm' | 'md' | 'lg';

/** Shape of page-number and navigation buttons. */
export type PixelPaginatorButtonShape = 'rounded' | 'circle';

/** Emitted whenever the user navigates to a different page or changes the page size. */
export interface PixelPageEvent {
  /** New zero-based page index. */
  readonly pageIndex: number;
  /** Previous zero-based page index. */
  readonly previousPageIndex: number;
  /** Active page size. */
  readonly pageSize: number;
  /** Total number of items. */
  readonly length: number;
}

/** A rendered page-number button (number or ellipsis gap). */
export interface PixelPageItem {
  readonly type: 'page' | 'ellipsis';
  /** Page index (zero-based) — only present for `type === 'page'`. */
  readonly index?: number;
  /** Visible label (1-based number or "…"). */
  readonly label: string;
  readonly active: boolean;
}

/**
 * Pagination control. Three variants:
 *
 * - **`default`** — Full chrome: first/prev/page-numbers/next/last + page-size selector + range label.
 *
 * - **`minimal`** — Icon-only navigation buttons, no labels or page-size selector.
 *
 * @example
 * ```html
 * <pixel-paginator [length]="total" [(pageIndex)]="page" [(pageSize)]="size" (page)="onPage($event)" />
 * ```
 */
@Component({
  selector: 'pixel-paginator',
  imports: [PixelButtonComponent, PixelSelectComponent, PixelSkeletonComponent, PixelTooltipDirective],
  templateUrl: './pixel-paginator.html',
  styleUrl: './pixel-paginator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-paginator',
    role: 'navigation',
    '[attr.aria-label]': 'ariaLabel() || "Pagination navigation"',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[class.pixel-paginator--disabled]': 'disabled()',
    '[attr.data-button-shape]': 'buttonShape()',
  },
})
export default class PixelPaginatorComponent {
  private readonly analytics = inject(PIXEL_UI_ANALYTICS, { optional: true });

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /** Total number of items. */
  readonly length = input(0, { transform: numberAttribute });

  /** Current zero-based page index. Two-way bindable. */
  readonly pageIndex = model(0);

  /** Number of items per page. Two-way bindable. */
  readonly pageSize = model(10);

  /** Available page-size choices (shown in the page-size selector). */
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50, 100]);

  /** Show first-page and last-page navigation buttons. */
  readonly showFirstLastButtons = input(true, { transform: booleanAttribute });

  /** Visual variant. */
  readonly variant = input<PixelPaginatorVariant>('default');

  /** Density scale. */
  readonly size = input<PixelPaginatorSize>('md');

  /** Disables all interaction. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Accessible label for the nav landmark. */
  readonly ariaLabel = input('');

  /**
   * Stable analytics id for this paginator (e.g. `claims-list`).
   *
   * @type {string}
   * @default ''
   * @description When `PIXEL_UI_ANALYTICS` is provided, page / page-size changes emit
   * `ui.paginator.page`.
   */
  readonly analyticsId = input('');

  /**
   * Extra analytics properties (reserved keys win).
   *
   * @type {Readonly<Record<string, unknown>> | undefined}
   * @default undefined
   */
  readonly analyticsProperties = input<Readonly<Record<string, unknown>> | undefined>(undefined);

  /**
   * When true, suppresses `ui.paginator.page` analytics events.
   *
   * @type {boolean}
   * @default false
   */
  readonly analyticsDisabled = input(false, { transform: booleanAttribute });

  /**
   * @type {string}
   * @default 'Items per page'
   * @description Visible + select label for the page-size control.
   */
  readonly itemsPerPageLabel = input('Items per page');

  /**
   * @type {string}
   * @default 'Page navigation'
   * @description `aria-label` for the prev/next button group.
   */
  readonly pageNavigationLabel = input('Page navigation');

  /**
   * @type {string}
   * @default 'First page'
   */
  readonly firstPageLabel = input('First page');

  /**
   * @type {string}
   * @default 'Previous page'
   */
  readonly previousPageLabel = input('Previous page');

  /**
   * @type {string}
   * @default 'Next page'
   */
  readonly nextPageLabel = input('Next page');

  /**
   * @type {string}
   * @default 'Last page'
   */
  readonly lastPageLabel = input('Last page');

  /**
   * @type {string}
   * @default 'Page'
   * @description Prefix for numbered page button aria-labels (`Page N`).
   */
  readonly pageNumberLabel = input('Page');

  /** Shape applied to all page-number and icon-navigation buttons. */
  readonly buttonShape = input<PixelPaginatorButtonShape>('rounded');

  /** When true, replaces the paginator with a skeleton placeholder. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /** Total page-number buttons to show including first and last pages (minimum 3). */
  readonly maxPageButtons = input(5, { transform: numberAttribute });

  // ── Outputs ─────────────────────────────────────────────────────────────────

  /** Emitted when the user navigates to a different page or changes the page size. */
  readonly page = output<PixelPageEvent>();

  constructor() {
    // If the current pageSize is not in pageSizeOptions, default to the first option.
    effect(() => {
      const options = this.pageSizeOptions();
      if (options.length > 0 && !options.includes(this.pageSize())) {
        this.pageSize.set(options[0]);
      }
    });
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  /** Maps buttonShape to pixel-button fabShape — 'rounded' falls back to 'square' corners on icon buttons. */
  protected readonly navFabShape = computed((): 'circle' | 'square' =>
    this.buttonShape() === 'circle' ? 'circle' : 'square',
  );

  /** Select size tracks paginator density — xs/sm→xs, md/lg→sm. */
  protected readonly selectSize = computed(() =>
    (this.size() === 'xs' || this.size() === 'sm') ? 'xs' : 'sm',
  );

  protected readonly skeletonHeight = computed(() => {
    switch (this.size()) {
      case 'xs': return '1.75rem';
      case 'sm': return '2rem';
      case 'lg': return '2.75rem';
      default:   return '2.25rem';
    }
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.length() / this.pageSize())),
  );

  protected readonly hasPrev = computed(() => this.pageIndex() > 0);
  protected readonly hasNext = computed(() => this.pageIndex() < this.pageCount() - 1);

  /** Human-readable "1–10 of 100" range label. */
  protected readonly rangeLabel = computed(() => {
    const len  = this.length();
    const size = this.pageSize();
    const idx  = this.pageIndex();
    if (len === 0 || size === 0) return '0 of ' + len;
    const start = idx * size + 1;
    const end   = Math.min(start + size - 1, len);
    return `${start}–${end} of ${len}`;
  });

  protected readonly pageLabel = computed(() =>
    `Page ${this.pageIndex() + 1} of ${this.pageCount()}`,
  );

  /** Options for the page-size `pixel-select`. */
  protected readonly sizeOptions = computed((): readonly PixelSelectOption[] =>
    this.pageSizeOptions().map((n) => ({ value: n, label: String(n) })),
  );

  /**
   * Page-number buttons for the `default` variant.
   * Shows the first page, a sliding window around the current page, and the last page,
   * with ellipsis gaps where pages are skipped — matching Angular Material's pattern.
   */
  protected readonly pageItems = computed((): readonly PixelPageItem[] => {
    const total   = this.pageCount();
    const current = this.pageIndex();
    // maxPageButtons = TOTAL visible page buttons including first and last.
    // wing = how many pages to show on each side of the current page (excluding first/last).
    // e.g. maxPageButtons=3 → wing=0 → shows: 1 … [cur] … N
    //      maxPageButtons=5 → wing=1 → shows: 1 … prev [cur] next … N
    const max  = Math.max(3, this.maxPageButtons());
    const wing = Math.floor((max - 2) / 2);

    if (total <= max) {
      // All pages fit — no ellipsis needed.
      return Array.from({ length: total }, (_, i) => this.pageBtn(i, current));
    }

    const items: PixelPageItem[] = [];
    items.push(this.pageBtn(0, current));

    const winStart = Math.max(1, current - wing);
    const winEnd   = Math.min(total - 2, current + wing);

    if (winStart > 1) items.push({ type: 'ellipsis', label: '…', active: false });
    for (let i = winStart; i <= winEnd; i++) items.push(this.pageBtn(i, current));
    if (winEnd < total - 2) items.push({ type: 'ellipsis', label: '…', active: false });

    items.push(this.pageBtn(total - 1, current));
    return items;
  });

  // ── Navigation ───────────────────────────────────────────────────────────────

  protected goFirst(): void { this.navigate(0); }
  protected goPrev():  void { this.navigate(this.pageIndex() - 1); }
  protected goNext():  void { this.navigate(this.pageIndex() + 1); }
  protected goLast():  void { this.navigate(this.pageCount() - 1); }
  protected goPage(index: number): void { this.navigate(index); }

  protected onPageSizeChange(value: unknown): void {
    const newSize = Number(value);
    if (!newSize || newSize === this.pageSize()) return;
    const prev = this.pageIndex();
    // Keep the current first item visible in the new page.
    const newIndex = Math.floor((prev * this.pageSize()) / newSize);
    this.pageSize.set(newSize);
    this.pageIndex.set(newIndex);
    this.page.emit({ pageIndex: newIndex, previousPageIndex: prev, pageSize: newSize, length: this.length() });
    this.emitPageAnalytics({
      pageIndex: newIndex,
      previousPageIndex: prev,
      pageSize: newSize,
      reason: 'pageSize',
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private navigate(index: number): void {
    if (this.disabled()) return;
    const clamped = Math.max(0, Math.min(index, this.pageCount() - 1));
    if (clamped === this.pageIndex()) return;
    const prev = this.pageIndex();
    this.pageIndex.set(clamped);
    this.page.emit({ pageIndex: clamped, previousPageIndex: prev, pageSize: this.pageSize(), length: this.length() });
    this.emitPageAnalytics({
      pageIndex: clamped,
      previousPageIndex: prev,
      pageSize: this.pageSize(),
      reason: 'navigate',
    });
  }

  private emitPageAnalytics(payload: {
    readonly pageIndex: number;
    readonly previousPageIndex: number;
    readonly pageSize: number;
    readonly reason: 'navigate' | 'pageSize';
  }): void {
    const paginatorId = this.analyticsId().trim();
    emitPixelUiAnalytics(this.analytics, {
      name: 'ui.paginator.page',
      component: 'pixel-paginator',
      disabled: this.analyticsDisabled(),
      extras: this.analyticsProperties(),
      reserved: {
        ...(paginatorId ? { paginatorId } : {}),
        pageIndex: payload.pageIndex,
        previousPageIndex: payload.previousPageIndex,
        pageSize: payload.pageSize,
        length: this.length(),
        reason: payload.reason,
      },
    });
  }

  private pageBtn(index: number, current: number): PixelPageItem {
    return { type: 'page', index, label: String(index + 1), active: index === current };
  }
}
