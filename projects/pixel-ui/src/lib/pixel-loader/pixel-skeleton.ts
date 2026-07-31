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
  type PixelSkeletonChartPieMode,
  type PixelSkeletonChartVariant,
  type PixelSkeletonMapLayout,
  type PixelSkeletonPathLayout,
  type PixelSkeletonPathPoint,
  type PixelSkeletonPieLayout,
  type PixelSkeletonPointsLayout,
  type PixelSkeletonPreset,
  type PixelSkeletonRadarLayout,
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
    '[attr.data-chart-pie-mode]':
      'preset() === "chart" && chartVariant() === "pie" ? resolvedPieMode() : null',
    '[attr.data-chart-path-mode]':
      'preset() === "chart" && (chartVariant() === "line" || chartVariant() === "area") ? resolvedPathMode() : null',
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
   * @component Pie / donut / semi mode when `chartVariant="pie"` (decorative + live).
   * @type {PixelSkeletonChartPieMode}
   * @default 'donut'
   */
  readonly chartPieMode = input<PixelSkeletonChartPieMode>('donut');

  /**
   * @component Bubble layout when `chartVariant="bubble"` (`cartesian` | `pack`).
   * @type {'cartesian' | 'pack'}
   * @default 'cartesian'
   */
  readonly chartBubbleLayout = input<'cartesian' | 'pack'>('cartesian');

  /**
   * @component Line interpolation when `chartVariant="line"`.
   * @type {'straight' | 'smooth' | 'step'}
   * @default 'straight'
   */
  readonly chartPathMode = input<'straight' | 'smooth' | 'step'>('straight');

  /**
   * @component Data-driven line / area path (from chart series).
   * @type {PixelSkeletonPathLayout | null}
   * @default null
   */
  readonly chartPathLayout = input<PixelSkeletonPathLayout | null>(null);

  /**
   * @component Data-driven pie segments (from chart slices).
   * @type {PixelSkeletonPieLayout | null}
   * @default null
   */
  readonly chartPieLayout = input<PixelSkeletonPieLayout | null>(null);

  /**
   * @component Data-driven scatter / bubble markers.
   * @type {PixelSkeletonPointsLayout | null}
   * @default null
   */
  readonly chartPointsLayout = input<PixelSkeletonPointsLayout | null>(null);

  /**
   * @component Data-driven radar radii.
   * @type {PixelSkeletonRadarLayout | null}
   * @default null
   */
  readonly chartRadarLayout = input<PixelSkeletonRadarLayout | null>(null);

  /**
   * @component Data-driven map land intensities.
   * @type {PixelSkeletonMapLayout | null}
   * @default null
   */
  readonly chartMapLayout = input<PixelSkeletonMapLayout | null>(null);

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

  readonly resolvedPathLayout = computed(() => {
    const layout = this.chartPathLayout();
    return layout && layout.series.length > 0 ? layout : null;
  });

  readonly resolvedPathMode = computed(
    () => this.resolvedPathLayout()?.mode ?? this.chartPathMode(),
  );

  readonly resolvedPieLayout = computed(() => {
    const layout = this.chartPieLayout();
    return layout && layout.segments.length > 0 ? layout : null;
  });

  readonly resolvedPieMode = computed(
    () => this.resolvedPieLayout()?.mode ?? this.chartPieMode(),
  );

  readonly pieSegmentStops = computed(() => {
    const layout = this.resolvedPieLayout();
    if (!layout) {
      return null;
    }
    let cursor = 0;
    return layout.segments.map((pct, i) => {
      const start = cursor;
      cursor += pct;
      return { start, end: cursor, opacity: 0.45 + (i % 3) * 0.18 };
    });
  });

  readonly resolvedPointsLayout = computed(() => {
    const layout = this.chartPointsLayout();
    return layout && layout.points.length > 0 ? layout : null;
  });

  readonly resolvedRadarLayout = computed(() => {
    const layout = this.chartRadarLayout();
    return layout && layout.series.length > 0 ? layout : null;
  });

  readonly resolvedMapLayout = computed(() => {
    const layout = this.chartMapLayout();
    return layout && layout.intensities.length > 0 ? layout : null;
  });

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

  protected pathSvgPoints(
    points: readonly PixelSkeletonPathPoint[],
    filled: boolean,
    mode: 'straight' | 'smooth' | 'step' = 'straight',
  ): string {
    if (points.length === 0) {
      return '';
    }
    const plot =
      mode === 'step' && points.length > 1 ? this.toStepPoints(points) : points;
    const coords = plot.map((p) => `${p.x},${100 - p.y}`);
    if (!filled) {
      return coords.join(' ');
    }
    const first = plot[0]!;
    const last = plot[plot.length - 1]!;
    return [`${first.x},100`, ...coords, `${last.x},100`].join(' ');
  }

  private toStepPoints(
    points: readonly PixelSkeletonPathPoint[],
  ): PixelSkeletonPathPoint[] {
    const out: PixelSkeletonPathPoint[] = [{ x: points[0]!.x, y: points[0]!.y }];
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const cur = points[i]!;
      out.push({ x: cur.x, y: prev.y });
      out.push({ x: cur.x, y: cur.y });
    }
    return out;
  }

  protected radarSvgPoints(radii: readonly number[], scale = 1): string {
    const n = radii.length;
    if (n === 0) {
      return '';
    }
    const cx = 50;
    const cy = 50;
    const maxR = 40 * scale;
    return radii
      .map((r, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const rad = (Math.max(0, Math.min(100, r)) / 100) * maxR;
        return `${cx + rad * Math.cos(angle)},${cy + rad * Math.sin(angle)}`;
      })
      .join(' ');
  }

  protected radarGridPoints(indicatorCount: number, scale: number): string {
    const n = Math.max(3, indicatorCount);
    return this.radarSvgPoints(Array.from({ length: n }, () => 100), scale);
  }

  protected radarSpokeLine(indicatorCount: number, index: number): string {
    const n = Math.max(3, indicatorCount);
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / n;
    const x = 50 + 40 * Math.cos(angle);
    const y = 50 + 40 * Math.sin(angle);
    return `50,50 ${x},${y}`;
  }

  protected radarSpokeIndexes(indicatorCount: number): number[] {
    return Array.from({ length: Math.max(3, indicatorCount) }, (_, i) => i);
  }

  /** Donut / pie / semi wedge path in a 100×100 viewBox (y down). */
  protected pieWedgePath(startPct: number, endPct: number, mode: PixelSkeletonChartPieMode): string {
    const cx = 50;
    const cy = mode === 'semi' ? 62 : 50;
    // Near-full viewBox so CSS size ≈ live ECharts radius (~72% of plot)
    const outer = mode === 'semi' ? 44 : 46;
    const inner = mode === 'pie' ? 0 : mode === 'semi' ? 26 : 31;
    const sweep = mode === 'semi' ? 180 : 360;
    // Semi: 180→360° in ECharts (left through bottom to right). Map % of total into that sweep.
    const base = mode === 'semi' ? Math.PI : -Math.PI / 2;
    const dir = 1;
    const a0 = base + dir * (startPct / 100) * ((sweep * Math.PI) / 180);
    const a1 = base + dir * (endPct / 100) * ((sweep * Math.PI) / 180);
    const x0 = cx + outer * Math.cos(a0);
    const y0 = cy + outer * Math.sin(a0);
    const x1 = cx + outer * Math.cos(a1);
    const y1 = cy + outer * Math.sin(a1);
    const large = ((endPct - startPct) / 100) * sweep > 180 ? 1 : 0;
    if (inner <= 0) {
      return `M ${cx} ${cy} L ${x0} ${y0} A ${outer} ${outer} 0 ${large} 1 ${x1} ${y1} Z`;
    }
    const ix0 = cx + inner * Math.cos(a0);
    const iy0 = cy + inner * Math.sin(a0);
    const ix1 = cx + inner * Math.cos(a1);
    const iy1 = cy + inner * Math.sin(a1);
    return `M ${x0} ${y0} A ${outer} ${outer} 0 ${large} 1 ${x1} ${y1} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${large} 0 ${ix0} ${iy0} Z`;
  }

  protected pieConicGradient(segments: readonly number[]): string {
    if (segments.length === 0) {
      return 'var(--pixel-loader-skeleton)';
    }
    let cursor = 0;
    const stops: string[] = [];
    segments.forEach((pct, i) => {
      const start = cursor;
      cursor += pct;
      const opacity = 55 + (i % 3) * 15;
      const color = `color-mix(in srgb, var(--pixel-loader-skeleton) ${opacity}%, transparent)`;
      stops.push(`${color} ${start}% ${cursor}%`);
    });
    return `conic-gradient(from -90deg, ${stops.join(', ')})`;
  }

  protected bubbleSizeRem(sizePct: number | undefined): number {
    const t = Math.max(0, Math.min(100, sizePct ?? 50)) / 100;
    return 0.7 + t * 1.6;
  }

  protected mapIntensityOpacity(intensity: number): number {
    return 0.35 + Math.max(0, Math.min(1, intensity)) * 0.55;
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
