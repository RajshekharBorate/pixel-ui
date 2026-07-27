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

/** Subset of ECharts theme fields Pixel maps from `--pixel-sys-*`. */
export type PixelChartEChartsTheme = {
  readonly color: readonly string[];
  readonly backgroundColor: string;
  readonly textStyle: { readonly color: string };
  readonly title: { readonly textStyle: { readonly color: string } };
  readonly legend: { readonly textStyle: { readonly color: string } };
  readonly tooltip: {
    readonly backgroundColor: string;
    readonly borderColor: string;
    readonly textStyle: { readonly color: string };
  };
  readonly categoryAxis: {
    readonly axisLine: { readonly lineStyle: { readonly color: string } };
    readonly axisLabel: { readonly color: string };
    readonly splitLine: { readonly lineStyle: { readonly color: string } };
  };
  readonly valueAxis: {
    readonly axisLine: { readonly lineStyle: { readonly color: string } };
    readonly axisLabel: { readonly color: string };
    readonly splitLine: { readonly lineStyle: { readonly color: string } };
  };
};
