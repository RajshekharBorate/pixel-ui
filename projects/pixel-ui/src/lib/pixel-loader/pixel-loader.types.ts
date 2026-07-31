/**
 * Shared types, models and pure helpers for the `pixel-loader` loading system.
 *
 * Every loader surface (`pixel-loader`, `pixel-skeleton`, `pixel-loading-container`), the
 * global {@link PixelLoadingService} and the HTTP interceptor consume these definitions so the
 * public contract stays consistent. Colors are never encoded here — components resolve them
 * from the `--pixel-loader-*` custom-property contract declared in `_pixel-loader-shared.scss`.
 */

/* -------------------------------------------------------------------------- */
/*  Enumerations                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The animated indicator drawn by `pixel-loader`.
 * - `spinner` / `ring` — circular SVG/border spinners.
 * - `dots` / `pulse` / `bounce` — three-element motion sets.
 * - `wave` / `bars` — five-bar equalizer motion.
 * - `skeleton` / `shimmer` — placeholder surfaces (usually via `pixel-skeleton`).
 * - `overlay` — spinner intended to sit inside `pixel-loading-container`.
 * - `custom` — render projected content instead of a built-in animation.
 */
export type PixelLoaderType =
  | 'spinner'
  | 'dots'
  | 'pulse'
  | 'ring'
  | 'wave'
  | 'bars'
  | 'bounce'
  | 'skeleton'
  | 'shimmer'
  | 'overlay'
  | 'custom';

/** Density scale shared across the loader family. */
export type PixelLoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Pixel metrics for each size — mirrors `--pixel-loader-dimension` / `--pixel-loader-thickness`
 * from `_pixel-loader-shared.scss` at a 16px root (1rem baseline).
 */
export const LOADER_SIZE_METRICS: Record<
  PixelLoaderSize,
  { readonly dimension: number; readonly thickness: number }
> = {
  xs: { dimension: 16, thickness: 2 },
  sm: { dimension: 28, thickness: 3 },
  md: { dimension: 40, thickness: 4 },
  lg: { dimension: 56, thickness: 5 },
  xl: { dimension: 80, thickness: 6 },
};

/** Scope of a {@link PixelLoadingContainer} backdrop. */
export type PixelLoaderScope = 'inline' | 'section' | 'overlay' | 'fullscreen';

/** Pre-built skeleton layouts exposed by `pixel-skeleton`. */
export type PixelSkeletonPreset =
  | 'text'
  | 'avatar'
  | 'card'
  | 'chart'
  | 'table'
  | 'form'
  | 'dashboard'
  | 'list'
  | 'custom';

/**
 * Plot silhouette for `preset="chart"` — mirrors chart facade families so loading
 * placeholders read as the right chart type (not always bars).
 */
export type PixelSkeletonChartVariant =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'scatter'
  | 'bubble'
  | 'radar'
  | 'gauge'
  | 'map';

/** Bar layout when `chartVariant="bar"` — mirrors `PixelChartBarMode`. */
export type PixelSkeletonChartBarMode = 'single' | 'grouped' | 'stacked' | 'percent';

/** Bar direction when `chartVariant="bar"` — mirrors `PixelChartBarOrientation`. */
export type PixelSkeletonChartBarOrientation = 'vertical' | 'horizontal';

/** One category in a data-driven bar skeleton (sizes are 0–100 plot %). */
export type PixelSkeletonBarCategoryLayout = {
  /** Per visible-series size, or stack segment weights. */
  readonly sizes: readonly number[];
  /** Stack extent % of the value axis (`stacked` / `percent` only). */
  readonly extentPercent?: number;
};

/**
 * Data-driven bar silhouette — proportions from live series so stubs match the chart
 * when `showSkeleton` flips. Built by chart facades via `buildSkeletonBarLayout`.
 */
export type PixelSkeletonBarLayout = {
  readonly categories: readonly PixelSkeletonBarCategoryLayout[];
  /** Matches facade `barMaxWidth` (px). */
  readonly barMaxWidthPx: number;
};

/** Point in a line/area path skeleton (0–100 plot %). */
export type PixelSkeletonPathPoint = {
  readonly x: number;
  readonly y: number;
};

/** One series polyline / area outline for cartesian path skeletons. */
export type PixelSkeletonPathSeries = {
  readonly points: readonly PixelSkeletonPathPoint[];
};

/**
 * Data-driven line / area silhouette — category values normalized to plot %.
 * Built via `buildSkeletonPathLayout`.
 */
export type PixelSkeletonPathLayout = {
  readonly series: readonly PixelSkeletonPathSeries[];
  /** When true, close each path to the baseline (area fill). */
  readonly filled: boolean;
};

/** Pie / donut segment weights (0–100 of the full circle). */
export type PixelSkeletonPieLayout = {
  readonly segments: readonly number[];
  readonly mode: 'pie' | 'donut' | 'semi';
};

/** Scatter / bubble marker for data-driven point skeletons. */
export type PixelSkeletonPointMarker = {
  /** 0–100 along the category / X axis. */
  readonly x: number;
  /** 0–100 from the top of the plot (CSS inset). */
  readonly y: number;
  /** Bubble diameter as 0–100 of max size (scatter omits → fixed). */
  readonly size?: number;
};

/** Data-driven scatter / bubble silhouette. */
export type PixelSkeletonPointsLayout = {
  readonly points: readonly PixelSkeletonPointMarker[];
  readonly kind: 'scatter' | 'bubble';
};

/** Data-driven radar silhouette — radii 0–100 per indicator. */
export type PixelSkeletonRadarLayout = {
  readonly series: readonly { readonly radii: readonly number[] }[];
  readonly indicatorCount: number;
};

/** Data-driven gauge silhouette. */
export type PixelSkeletonGaugeLayout = {
  /** Fill along the arc / track (0–100). */
  readonly fillPercent: number;
  /** Mirrors facade `variant` (radial, linear, …). */
  readonly variant: string;
};

/** Data-driven map intensity stubs (0–1 per land blob). */
export type PixelSkeletonMapLayout = {
  readonly intensities: readonly number[];
};

/** Geometry of a single skeleton block. */
export type PixelSkeletonShape = 'text' | 'circle' | 'rect' | 'rounded';

/** Placeholder animation applied to skeleton blocks. */
export type PixelSkeletonAnimation = 'shimmer' | 'pulse' | 'wave' | 'none';

/* -------------------------------------------------------------------------- */
/*  Event payloads                                                            */
/* -------------------------------------------------------------------------- */

/** Emitted by `pixel-loader` whenever its resolved visibility flips (after delay/min-duration). */
export interface PixelLoaderVisibilityEvent {
  /** Whether the loader is now visible on screen. */
  readonly visible: boolean;
}

/** A single tracked async/HTTP operation inside the {@link PixelLoadingService}. */
export interface PixelLoadingTask {
  /** Stable identifier (request URL, feature key, route, etc.). */
  readonly id: string;
  /** Optional human-readable label surfaced to screen readers / overlays. */
  readonly message?: string;
  /** Optional determinate progress 0–100; `null` ⇒ indeterminate. */
  readonly progress: number | null;
  /** Epoch ms the task was registered — used for minimum-duration math. */
  readonly startedAt: number;
  /** Optional category used to scope concurrent counts (e.g. `'http' | 'upload'`). */
  readonly scope?: string;
}

/* -------------------------------------------------------------------------- */
/*  Pure helpers — shared by components, the service and the spec.            */
/* -------------------------------------------------------------------------- */

/** Clamp a 0–100 percentage, guarding against NaN / out-of-range input. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

/**
 * Heuristic for {@link PixelLoadingService}-driven "smart" loading: pick a sensible loader type
 * for the nature of the work.
 * - long-running / page work ⇒ `skeleton`
 * - everything else ⇒ `spinner`
 *
 * For determinate progress bars use `pixel-progress-bar` instead.
 */
export function smartLoaderType(options: {
  readonly determinate?: boolean;
  readonly page?: boolean;
}): PixelLoaderType {
  if (options.page) {
    return 'skeleton';
  }
  return 'spinner';
}

/** Number of repeated lines a text-style skeleton preset renders by default. */
export const SKELETON_PRESET_LINES: Record<PixelSkeletonPreset, number> = {
  text: 3,
  avatar: 1,
  card: 3,
  chart: 1,
  table: 4,
  form: 3,
  dashboard: 4,
  list: 4,
  custom: 1,
};
