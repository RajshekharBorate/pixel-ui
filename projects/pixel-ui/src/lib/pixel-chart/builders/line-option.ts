import {
  countCartesianPoints,
  resolveChartPerformance,
  withSeriesPerformance,
  type PixelChartPerformanceMode,
} from './performance-option';
import type { EChartsCoreOption } from 'echarts/core';
import { resolvePixelChartPaletteColors } from '../pixel-chart-theme';
import type {
  PixelChartAxisLines,
  PixelChartAxisPointer,
  PixelChartDateFormat,
  PixelChartGridLines,
  PixelChartNumberFormat,
  PixelChartPalette,
  PixelChartPlotPadding,
  PixelChartReferenceBand,
  PixelChartReferenceLine,
  PixelChartSeries,
  PixelChartShowValues,
} from '../pixel-chart.types';
import {
  axisLineFields,
  axisNameFields,
  defaultCartesianGrid,
  formatChartValue,
  resolveCartesianGrid,
  resolveShowLabel,
  seriesValuesForCategories,
  splitLineFields,
} from './cartesian-utils';
import {
  withDataZoom,
  resolveDataZoomMode,
  type PixelChartDataZoomMode,
} from './interaction-option';
import { resolveStableItemColor } from './series-color';
import {
  formatChartAxisLabel,
  normalizeCategoryLabels,
  toChartTimestamp,
  type PixelChartAxisValue,
  type PixelChartXAxisType,
} from './time-axis';
import {
  axisPointerFields,
  valueAxisLabelFields,
  withSeriesReferences,
} from './reference-option';

export type PixelChartLineMode = 'straight' | 'smooth' | 'step';

export type PixelChartLineOptionArgs = {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly PixelChartAxisValue[];
  readonly mode: PixelChartLineMode;
  readonly showValues: PixelChartShowValues;
  readonly showMarkers?: boolean;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  /** Series color palette (stable by full series index when toggling legend). */
  readonly palette?: PixelChartPalette;
  readonly autoLabelMaxCells?: number;
  /** Zoom mode. Prefer `'auto'` / `'selection'` for large category sets. */
  readonly dataZoom?: PixelChartDataZoomMode | 'auto';
  readonly zoomThreshold?: number;
  /** Progressive / sampling preset for large N. */
  readonly performance?: PixelChartPerformanceMode;
  /** `'time'` uses a time axis when categories parse as dates/timestamps. */
  readonly xAxisType?: PixelChartXAxisType;
  /** Optional label formatter (e.g. via PixelDateAdapter). */
  readonly formatCategory?: (value: PixelChartAxisValue) => string;
  /** Date style for time / date-like categories when `formatCategory` is unset. */
  readonly categoryFormat?: PixelChartDateFormat | null;
  /** Optional X-axis title (e.g. `Month`). */
  readonly xAxisName?: string;
  /** Optional Y-axis title (e.g. `Sales (in K)`). */
  readonly yAxisName?: string;
  /**
   * Suffix appended to absolute value labels / tooltips (e.g. `K` → `85K`).
   */
  readonly valueSuffix?: string;
  /** Advanced number format; `valueSuffix` remains the simple shorthand. */
  readonly valueFormat?: PixelChartNumberFormat | null;
  /** Tick labels on the value axis (falls back to `valueFormat`). */
  readonly axisValueFormat?: PixelChartNumberFormat | null;
  /** Label for null / empty values. @default '—' */
  readonly nullLabel?: string;
  readonly locale?: string;
  /** Stroke width in px. @default 2 */
  readonly lineWidth?: number;
  /** Marker diameter in px. @default 8 */
  readonly markerSize?: number;
  /** Category inset; time axes use a 2% inset when true. @default true */
  readonly boundaryGap?: boolean;
  /** Plot grid guides. @default 'on' */
  readonly gridLines?: PixelChartGridLines;
  /** Axis baselines. @default 'on' */
  readonly axisLines?: PixelChartAxisLines;
  /** Optional grid inset overrides. */
  readonly plotPadding?: PixelChartPlotPadding;
  /** Tooltip axis pointer. @default 'line' */
  readonly axisPointer?: PixelChartAxisPointer;
  readonly referenceLines?: readonly PixelChartReferenceLine[] | null;
  readonly referenceBands?: readonly PixelChartReferenceBand[] | null;
};

/**
 * Pure ECharts option builder for line charts.
 * Call `ensureLineChart()` before rendering.
 */
export function buildLineChartOption(args: PixelChartLineOptionArgs): EChartsCoreOption {
  const {
    series,
    categories,
    mode,
    showValues,
    showMarkers = true,
    hiddenSeriesIds,
    palette = 'brand',
    autoLabelMaxCells = 24,
    xAxisType = 'category',
    formatCategory,
    categoryFormat = null,
    xAxisName = '',
    yAxisName = '',
    valueSuffix = '',
    valueFormat = null,
    axisValueFormat = null,
    nullLabel = '—',
    locale,
    lineWidth = 2,
    markerSize = 8,
    boundaryGap = true,
    gridLines = 'on',
    axisLines = 'on',
    plotPadding,
    axisPointer = 'line',
    referenceLines = null,
    referenceBands = null,
  } = args;

  const colors = resolvePixelChartPaletteColors(palette);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const catCount = categories.length;
  const resolveCategoryLabel =
    formatCategory ??
    ((v: PixelChartAxisValue) =>
      formatChartAxisLabel(v, {
        locale: categoryFormat?.locale ?? locale,
        dateStyle: categoryFormat?.dateStyle,
      }));
  const labelCats = normalizeCategoryLabels(categories, resolveCategoryLabel);
  const valueMatrix = visible.map((s) => seriesValuesForCategories(s, labelCats));
  const showLabel = resolveShowLabel(showValues, visible.length, catCount, autoLabelMaxCells);

  const smooth = mode === 'smooth';
  const step = mode === 'step' ? ('start' as const) : undefined;
  const useTime =
    xAxisType === 'time' && categories.every((c) => toChartTimestamp(c) != null);
  // Values / hover labels need symbols. Keep a 1px idle hit target when both are off
  // so emphasis labels still paint (ECharts skips labels when showSymbol is false).
  const persistMarkers = showMarkers || showLabel;
  const showSymbol = persistMarkers ? showLabel || catCount < 200 : true;
  const resolvedSymbolSize = persistMarkers ? markerSize : 1;

  const formatOpts = {
    suffix: valueSuffix,
    format: valueFormat,
    locale,
    nullLabel,
  };

  const formatLineLabel = (params: {
    value?: number | null | (number | null)[];
  }): string => {
    const raw = params.value;
    const v = Array.isArray(raw) ? raw[1] : raw;
    if (v == null || Number.isNaN(Number(v))) {
      return '';
    }
    return formatChartValue(v, false, formatOpts);
  };

  const seriesList = visible.map((s, index) => {
    const color = resolveStableItemColor(s, series, colors);
    return {
      id: s.id,
      name: s.name,
      type: 'line' as const,
      data: useTime
        ? valueMatrix[index]!.map((y, i) => [toChartTimestamp(categories[i]!)!, y] as const)
        : valueMatrix[index],
      smooth,
      step,
      showSymbol,
      symbolSize: resolvedSymbolSize,
      itemStyle: { color },
      lineStyle: {
        width: lineWidth,
        color,
      },
      label: {
        show: showLabel,
        position: 'top',
        distance: 6,
        formatter: formatLineLabel,
      },
      emphasis: {
        focus: 'series',
        scale: true,
        label: {
          show: true,
          position: 'top',
          distance: 6,
          formatter: formatLineLabel,
        },
      },
    };
  });

  const base: EChartsCoreOption = {
    grid: resolveCartesianGrid(
      defaultCartesianGrid({ xAxisName, yAxisName }),
      plotPadding,
    ),
    tooltip: {
      trigger: 'axis',
      ...axisPointerFields(axisPointer, 'line'),
      valueFormatter: (value: unknown) => formatChartValue(value, false, formatOpts),
    },
    legend: { show: false },
    xAxis: useTime
      ? {
          type: 'time',
          boundaryGap: boundaryGap ? (['2%', '2%'] as [string, string]) : false,
          axisLabel: {
            hideOverlap: true,
            formatter: (value: number) => resolveCategoryLabel(value),
          },
          ...axisLineFields(axisLines, 'x'),
          ...splitLineFields(gridLines, 'category', 'x'),
          ...axisNameFields(xAxisName),
        }
      : {
          type: 'category',
          data: [...labelCats],
          boundaryGap,
          axisTick: { alignWithLabel: true },
          axisLabel: { showMinLabel: true, showMaxLabel: true },
          ...axisLineFields(axisLines, 'x'),
          ...splitLineFields(gridLines, 'category', 'x'),
          ...axisNameFields(xAxisName),
        },
    yAxis: {
      type: 'value',
      ...valueAxisLabelFields({
        axisValueFormat,
        valueFormat,
        valueSuffix,
        locale,
      }),
      ...axisLineFields(axisLines, 'y'),
      ...splitLineFields(gridLines, 'value', 'y'),
      ...axisNameFields(yAxisName),
    },
    series: withSeriesReferences(seriesList as Record<string, unknown>[], {
      referenceLines,
      referenceBands,
      format: valueFormat,
      locale,
      valueSuffix,
    }),
  };

  const withZoom = withDataZoom(
    base,
    args.dataZoom === 'auto' || args.dataZoom == null
      ? resolveDataZoomMode('auto', catCount, args.zoomThreshold)
      : args.dataZoom,
  );

  const pointCount = countCartesianPoints(visible.length, catCount);
  return withSeriesPerformance(
    withZoom,
    resolveChartPerformance(args.performance, pointCount, { allowSampling: true }),
  );
}
