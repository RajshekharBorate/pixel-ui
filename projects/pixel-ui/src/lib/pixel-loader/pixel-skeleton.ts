import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import {
  SKELETON_PRESET_LINES,
  type PixelSkeletonAnimation,
  type PixelSkeletonBarLayout,
  type PixelSkeletonChartBarMode,
  type PixelSkeletonChartBarOrientation,
  type PixelSkeletonChartVariant,
  type PixelSkeletonPreset,
  type PixelSkeletonShape,
} from './pixel-loader.types';

/** A render-ready skeleton block (internal view-model produced by the presets). */
interface SkeletonBlock {
  readonly shape: PixelSkeletonShape;
  readonly width: string;
  readonly height: string;
}

/** A row of skeleton blocks (used by `table` / `dashboard` presets). */
interface SkeletonRow {
  readonly cells: readonly SkeletonBlock[];
}

/**
 * Content-placeholder (skeleton) loader.
 *
 * Renders shimmer/pulse/wave placeholder surfaces while real content streams in. Drive it with
 * a low-level `shape` + `lines` configuration, or pick a high-level `preset`
 * (`text`, `avatar`, `card`, `chart`, `table`, `form`, `dashboard`, `list`) to stamp out a
 * ready-made layout. For `preset="chart"`, set `chartVariant` to match the plot family
 * (`bar`, `line`, `pie`, …). Geometry is fully signal-derived and colors come from the
 * `--pixel-loader-*` theme contract. Honors `prefers-reduced-motion` and is hidden from
 * assistive tech (`aria-hidden`) since the surrounding region already exposes a
 * `role="status"` loader.
 *
 * @example
 * ```html
 * <!-- Three shimmering text lines -->
 * <pixel-skeleton preset="text" />
 *
 * <!-- Card placeholder (avatar + title + body) -->
 * <pixel-skeleton preset="card" />
 *
 * <!-- Chart plot placeholder — variant matches the facade -->
 * <pixel-skeleton preset="chart" chartVariant="line" height="280px" />
 * <pixel-skeleton preset="chart" chartVariant="pie" height="280px" />
 *
 * <!-- Custom single block -->
 * <pixel-skeleton shape="rounded" width="12rem" height="3rem" animation="pulse" />
 *
 * <!-- 5-row, 4-column table placeholder -->
 * <pixel-skeleton preset="table" [rows]="5" [columns]="4" />
 * ```
 */
@Component({
  selector: 'pixel-skeleton',
  templateUrl: './pixel-skeleton.html',
  styleUrl: './pixel-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-skeleton',
    'aria-hidden': 'true',
    '[attr.data-preset]': 'preset()',
    '[attr.data-chart-variant]': 'preset() === "chart" ? chartVariant() : null',
    '[attr.data-chart-bar-mode]':
      'preset() === "chart" && chartVariant() === "bar" ? chartBarMode() : null',
    '[attr.data-chart-bar-orientation]':
      'preset() === "chart" && chartVariant() === "bar" ? chartBarOrientation() : null',
    '[attr.data-animation]': 'animation()',
  },
})
export default class PixelSkeletonComponent {
  /**
   * @component High-level layout to stamp out. Use `custom` (default) for a single block driven
   * by `shape` / `width` / `height` / `lines`.
   * @type {PixelSkeletonPreset}
   * @default 'custom'
   */
  readonly preset = input<PixelSkeletonPreset>('custom');

  /**
   * @component Plot silhouette when `preset="chart"` (bar columns, line path, pie ring, …).
   * @type {PixelSkeletonChartVariant}
   * @default 'bar'
   */
  readonly chartVariant = input<PixelSkeletonChartVariant>('bar');

  /**
   * @component Bar layout when `chartVariant="bar"` (`single` / `grouped` / `stacked` / `percent`).
   * @type {PixelSkeletonChartBarMode}
   * @default 'grouped'
   */
  readonly chartBarMode = input<PixelSkeletonChartBarMode>('grouped');

  /**
   * @component Bar direction when `chartVariant="bar"` (`vertical` columns or `horizontal` bars).
   * @type {PixelSkeletonChartBarOrientation}
   * @default 'vertical'
   */
  readonly chartBarOrientation = input<PixelSkeletonChartBarOrientation>('vertical');

  /**
   * @component Optional data-driven bar sizes (from chart series). When set, stubs match live
   * proportions; when `null` / empty, decorative placeholders are used.
   * @type {PixelSkeletonBarLayout | null}
   * @default null
   */
  readonly chartBarLayout = input<PixelSkeletonBarLayout | null>(null);

  /**
   * @component Geometry of a `custom` block.
   * @type {PixelSkeletonShape}
   * @default 'text'
   */
  readonly shape = input<PixelSkeletonShape>('text');

  /**
   * @component Placeholder animation.
   * @type {PixelSkeletonAnimation}
   * @default 'shimmer'
   */
  readonly animation = input<PixelSkeletonAnimation>('shimmer');

  /**
   * @component Number of repeated lines/blocks for the `text` / `custom` presets (and the row
   * count fallback for layout presets when `rows` is not set).
   * @type {number}
   * @default 0
   */
  readonly lines = input(0, { transform: numberAttribute });

  /**
   * @component Explicit block width (any CSS length). Falls back to a preset-derived width.
   * @type {string}
   * @default ''
   */
  readonly width = input('');

  /**
   * @component Explicit block height (any CSS length). Falls back to a shape/preset default.
   * @type {string}
   * @default ''
   */
  readonly height = input('');

  /**
   * @component Row count for `table` / `dashboard` / `list` presets.
   * @type {number}
   * @default 4
   */
  readonly rows = input(4, { transform: numberAttribute });

  /**
   * @component Column count for the `table` preset.
   * @type {number}
   * @default 4
   */
  readonly columns = input(4, { transform: numberAttribute });

  /**
   * @component Round the block corners (applies to `custom` rect blocks).
   * @type {boolean}
   * @default false
   */
  readonly rounded = input(false, { transform: booleanAttribute });

  /**
   * @component Extra static classes appended to the host.
   * @type {string}
   * @default ''
   */
  readonly className = input('');

  /**
   * @component Override the block's border-radius with any CSS length or expression.
   * Use when the consuming component needs to match a specific shape (e.g. a checkbox box).
   * @type {string}
   * @default ''
   */
  readonly borderRadius = input('');

  /** Resolved repeat count for line-based presets. */
  private readonly resolvedLines = computed(() => {
    const explicit = this.lines();
    if (explicit > 0) {
      return explicit;
    }
    return SKELETON_PRESET_LINES[this.preset()] ?? 1;
  });

  /** Blocks for the simple `custom` / `text` path. */
  readonly blocks = computed<readonly SkeletonBlock[]>(() => {
    const count = this.preset() === 'text' ? this.resolvedLines() : Math.max(1, this.lines() || 1);
    const shape = this.shape();
    const baseWidth = this.width();
    const baseHeight = this.height() || this.defaultHeight(shape);
    return Array.from({ length: count }, (_, index) => ({
      shape,
      // Stagger trailing line widths so text blocks read naturally (last line shorter).
      width: baseWidth || (shape === 'text' ? this.textLineWidth(index, count) : '100%'),
      height: baseHeight,
    }));
  });

  /** Table rows × columns of equal cells. */
  readonly tableRows = computed<readonly SkeletonRow[]>(() => {
    const rows = Math.max(1, this.rows());
    const cols = Math.max(1, this.columns());
    return Array.from({ length: rows }, () => ({
      cells: Array.from({ length: cols }, () => ({
        shape: 'text' as PixelSkeletonShape,
        width: '100%',
        height: '0.9rem',
      })),
    }));
  });

  /** Repeated list/dashboard rows for the `list` preset. */
  readonly listRows = computed(() => Array.from({ length: Math.max(1, this.rows()) }, (_, i) => i));

  /** Category stubs for the `chart` + `bar` variant (default 5). */
  readonly chartBars = computed(() =>
    Array.from({ length: Math.max(3, Math.min(8, this.columns() || 5)) }, (_, i) => i),
  );

  /** Series stubs inside a grouped / stacked bar category (fixed 3 for silhouette rhythm). */
  readonly chartBarSeries = computed(() => [0, 1, 2] as const);

  /** True when bar silhouette should stack segments (`stacked` or `percent`). */
  readonly chartBarStacked = computed(() => {
    const mode = this.chartBarMode();
    return mode === 'stacked' || mode === 'percent';
  });

  /** Prefer live series layout; otherwise decorative category count. */
  readonly resolvedBarCategories = computed(() => {
    const layout = this.chartBarLayout();
    if (layout && layout.categories.length > 0) {
      return layout.categories;
    }
    return null;
  });

  /** Grouped class: mode=grouped, or single with multiple series sizes in live layout. */
  readonly chartBarsGrouped = computed(() => {
    if (this.chartBarMode() === 'grouped') {
      return true;
    }
    if (this.chartBarMode() !== 'single') {
      return false;
    }
    const first = this.resolvedBarCategories()?.[0];
    return (first?.sizes.length ?? 1) > 1;
  });

  /** Only when live layout is present — otherwise CSS fallbacks keep decorative sizing. */
  readonly chartBarMaxWidthPx = computed(() => this.chartBarLayout()?.barMaxWidthPx ?? null);

  /** Marker / bubble stubs for scatter & bubble variants. */
  readonly chartDots = computed(() => Array.from({ length: 6 }, (_, i) => i));

  /** Plot block-size for `chart` — prefer an absolute length from the chart host. */
  readonly chartPlotHeight = computed(() => this.height().trim() || '280px');

  readonly rounded$ = computed(() => this.rounded());

  /** Clamp live value % so zero stubs stay faintly visible. */
  protected barPlotPercent(size: number): number {
    return Math.max(size, 2);
  }

  /** Flex weight for stacked segments (avoid zero-grow collapse). */
  protected barFlexGrow(size: number): number {
    return Math.max(size, 0.01);
  }

  private defaultHeight(shape: PixelSkeletonShape): string {
    switch (shape) {
      case 'circle':
        return '2.5rem';
      case 'rect':
      case 'rounded':
        return '8rem';
      default:
        return '0.85rem';
    }
  }

  /** Last text line is shorter for a natural paragraph rhythm. */
  private textLineWidth(index: number, count: number): string {
    return index === count - 1 && count > 1 ? '62%' : '100%';
  }
}
