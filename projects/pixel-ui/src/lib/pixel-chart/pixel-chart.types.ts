/**
 * Shared chart data & event contracts for `pixel-ui/charts`.
 * Family-specific mode unions live next to each chart component.
 */

/** Single datum; `y: null` creates a gap in line/area series. */
export type PixelChartPoint = {
  readonly x: string | number | Date;
  readonly y: number | null;
  readonly size?: number;
  readonly label?: string;
  /** Optional per-point color (e.g. single-series bars matching a categorical legend). */
  readonly color?: string;
};

/** Named series consumed by cartesian / polar facades. */
export type PixelChartSeries = {
  readonly id: string;
  readonly name: string;
  readonly data: readonly PixelChartPoint[] | readonly number[];
  readonly color?: string;
};

/** Value-label visibility; `auto` hides colliding labels. */
export type PixelChartShowValues = boolean | 'auto';

/**
 * Which plot grid (split) lines to show.
 * - `on` — both axes (value-axis guides on cartesian by default)
 * - `off` — none
 * - `x` — only lines perpendicular to the X axis
 * - `y` — only lines perpendicular to the Y axis
 */
export type PixelChartGridLines = 'on' | 'off' | 'x' | 'y';

/**
 * Which axis baselines to show.
 * - `on` — both X and Y
 * - `off` — neither
 * - `x` / `y` — only that axis
 */
export type PixelChartAxisLines = 'on' | 'off' | 'x' | 'y';

/** Optional inset overrides for the ECharts `grid` box (px or CSS-like number). */
export type PixelChartPlotPadding = {
  readonly top?: number;
  readonly right?: number;
  readonly bottom?: number;
  readonly left?: number;
};

/**
 * Advanced number formatting for labels / tooltips.
 * Prefer `valueSuffix` for simple appends (e.g. `K`); use this for currency / decimals / compact.
 * Locale comes from the app (`LOCALE_ID`) unless `locale` is set (rare mixed-locale screens).
 */
export type PixelChartNumberFormat = {
  readonly style?: 'decimal' | 'percent' | 'currency' | 'compact';
  readonly currency?: string;
  readonly minimumFractionDigits?: number;
  readonly maximumFractionDigits?: number;
  /** Appended after the formatted number when style is not `percent`. */
  readonly suffix?: string;
  readonly locale?: string;
};

/** Date formatting for time / category axes (uses app locale by default). */
export type PixelChartDateFormat = {
  readonly locale?: string;
  readonly dateStyle?: 'short' | 'medium' | 'long';
};

/** Horizontal / vertical reference line (SLA, target). */
export type PixelChartReferenceLine = {
  readonly id: string;
  readonly value: number;
  readonly axis?: 'x' | 'y';
  readonly label?: string;
  readonly color?: string;
  readonly lineStyle?: 'solid' | 'dashed' | 'dotted';
};

/** Band between two values on an axis (warning / OK zone). */
export type PixelChartReferenceBand = {
  readonly id: string;
  readonly from: number;
  readonly to: number;
  readonly axis?: 'x' | 'y';
  readonly label?: string;
  readonly color?: string;
};

/** Tooltip axis pointer style for cartesian charts. */
export type PixelChartAxisPointer = 'line' | 'shadow' | 'cross' | 'none';

/** Built-in palette ids matching docs mockup swatches. */
export type PixelChartPaletteId = 'brand' | 'vibrant' | 'cool' | 'warm';

/** Palette id or explicit color list. */
export type PixelChartPalette = PixelChartPaletteId | readonly string[];

/** Image export formats (distinct from tabular `PixelExportFormat`). */
export type PixelChartImageExportFormat = 'png' | 'svg' | 'pdf';

export type PixelChartInteractionSource = 'mouse' | 'keyboard';

export type PixelChartPointClickEvent = {
  readonly seriesId: string;
  readonly seriesName: string;
  readonly pointIndex: number;
  readonly x: string | number | Date;
  readonly y: number | null;
  readonly source: PixelChartInteractionSource;
  readonly originalEvent: Event;
};

/** Fired on dataZoom (inside / slider). */
export type PixelChartDataZoomEvent = {
  readonly start: number | null;
  readonly end: number | null;
  readonly raw: unknown;
};

/** Axis style slice mapped from `--pixel-sys-*`. */
export type PixelChartAxisTheme = {
  readonly axisLine: { readonly lineStyle: { readonly color: string } };
  readonly axisLabel: { readonly color: string; readonly fontFamily: string };
  readonly axisTick: { readonly lineStyle: { readonly color: string } };
  readonly splitLine: {
    readonly lineStyle: {
      readonly color: string;
      readonly opacity?: number;
      readonly width?: number;
    };
  };
  readonly nameTextStyle: { readonly color: string; readonly fontFamily: string };
};

/** Subset of ECharts theme fields Pixel maps from `--pixel-sys-*`. */
export type PixelChartEChartsTheme = {
  readonly color: readonly string[];
  readonly backgroundColor: string;
  readonly textStyle: { readonly color: string; readonly fontFamily: string };
  readonly title: { readonly textStyle: { readonly color: string; readonly fontFamily: string } };
  readonly legend: { readonly textStyle: { readonly color: string; readonly fontFamily: string } };
  /** Plot tooltip chrome — mirrors `pixel-tooltip` inverse theme (not the directive itself). */
  readonly tooltip: {
    readonly backgroundColor: string;
    readonly borderColor: string;
    readonly borderWidth: number;
    readonly padding: readonly [number, number];
    readonly extraCssText: string;
    readonly textStyle: {
      readonly color: string;
      readonly fontFamily: string;
      readonly fontSize: number;
      readonly fontWeight: number;
      readonly lineHeight: number;
    };
  };
  readonly categoryAxis: PixelChartAxisTheme;
  readonly valueAxis: PixelChartAxisTheme;
  /** Defaults from `--pixel-chart-line-width` / `--pixel-chart-area-opacity` (facades may override). */
  readonly line?: {
    readonly lineStyle?: { readonly width?: number };
    readonly areaStyle?: { readonly opacity?: number };
  };
  readonly visualMap?: {
    readonly inRange?: { readonly color?: readonly string[] };
    readonly textStyle?: { readonly color: string; readonly fontFamily: string };
  };
  /** Geographic map chrome (land / borders) from `--pixel-chart-map-*`. */
  readonly map?: {
    readonly noDataColor: string;
    readonly borderColor: string;
    readonly emphasisBorderColor: string;
    readonly shadowColor: string;
  };
};
