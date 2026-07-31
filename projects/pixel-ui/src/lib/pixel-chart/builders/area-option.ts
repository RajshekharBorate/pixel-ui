import type { EChartsCoreOption } from 'echarts/core';
import { resolvePixelChartPaletteColors } from '../pixel-chart-theme';
import type {
  PixelChartAxisLines,
  PixelChartAxisPointer,
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
  toPercentStacks,
} from './cartesian-utils';
import {
  withDataZoom,
  resolveDataZoomMode,
  type PixelChartDataZoomMode,
} from './interaction-option';
import {
  countCartesianPoints,
  resolveChartPerformance,
  withSeriesPerformance,
  type PixelChartPerformanceMode,
} from './performance-option';
import { resolveStableItemColor } from './series-color';
import {
  normalizeCategoryLabels,
  type PixelChartAxisValue,
} from './time-axis';
import {
  axisPointerFields,
  valueAxisLabelFields,
  withSeriesReferences,
} from './reference-option';

export type PixelChartAreaMode = 'overlay' | 'stacked' | 'percent' | 'stream';

export type PixelChartAreaOptionArgs = {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly PixelChartAxisValue[];
  readonly mode: PixelChartAreaMode;
  readonly showValues: PixelChartShowValues;
  readonly showMarkers?: boolean;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  /** Series color palette (stable by full series index when toggling legend). */
  readonly palette?: PixelChartPalette;
  readonly autoLabelMaxCells?: number;
  readonly dataZoom?: PixelChartDataZoomMode | 'auto';
  readonly zoomThreshold?: number;
  readonly performance?: PixelChartPerformanceMode;
  /** Optional X-axis title (e.g. `Month`). */
  readonly xAxisName?: string;
  /** Optional Y-axis title (e.g. `Sales (in K)`). */
  readonly yAxisName?: string;
  /**
   * Suffix appended to absolute value labels / tooltips (e.g. `K` → `85K`).
   * Ignored in `percent` mode (those use `%`).
   */
  readonly valueSuffix?: string;
  /** Advanced number format; `valueSuffix` remains the simple shorthand. */
  readonly valueFormat?: PixelChartNumberFormat | null;
  /** Tick labels on the value axis (falls back to `valueFormat`). */
  readonly axisValueFormat?: PixelChartNumberFormat | null;
  /** Label for null / empty values. @default '—' */
  readonly nullLabel?: string;
  readonly locale?: string;
  /** Outline stroke width. @default 2 */
  readonly lineWidth?: number;
  /** Fill opacity (0–1). Defaults: overlay 0.35, stacked/percent 0.75, stream 0.85. */
  readonly areaOpacity?: number;
  /** Marker diameter in px. @default 6 */
  readonly markerSize?: number;
  /** Category inset. @default true */
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

function formatAreaLabel(
  value: unknown,
  percent: boolean,
  suffix: string,
  format?: PixelChartNumberFormat | null,
  locale?: string,
  nullLabel = '—',
): string {
  if (value == null || value === '') {
    return '';
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return '';
  }
  if (percent && !format) {
    return `${n.toFixed(0)}%`;
  }
  return formatChartValue(n, percent, { suffix, format, locale, nullLabel });
}

/**
 * Shared point chrome for every area mode.
 * ECharts only persistently paints line labels when point symbols exist, so enabling
 * values also enables symbols. When values are hidden, emphasis still reveals the value
 * above the hover marker. Markers alone still work without persistent labels.
 */
function areaSeriesPointChrome(args: {
  readonly showLabel: boolean;
  readonly showMarkers: boolean;
  readonly percent: boolean;
  readonly valueSuffix: string;
  readonly markerSize: number;
  readonly valueFormat?: PixelChartNumberFormat | null;
  readonly locale?: string;
  readonly nullLabel?: string;
}): Record<string, unknown> {
  const {
    showLabel,
    showMarkers,
    percent,
    valueSuffix,
    markerSize,
    valueFormat,
    locale,
    nullLabel = '—',
  } = args;
  return {
    // Keep hover markers when both are off; persist symbols when either is on.
    showSymbol: showMarkers || showLabel,
    symbolSize: markerSize,
    label: {
      show: showLabel,
      position: 'top',
      distance: 6,
      formatter: (params: { value?: number | null }) =>
        formatAreaLabel(params.value, percent, valueSuffix, valueFormat, locale, nullLabel),
    },
    emphasis: {
      focus: 'series',
      label: {
        show: true,
        position: 'top',
        distance: 6,
        formatter: (params: { value?: number | null }) =>
          formatAreaLabel(params.value, percent, valueSuffix, valueFormat, locale, nullLabel),
      },
    },
  };
}

function resolveAreaOpacity(
  mode: PixelChartAreaMode,
  areaOpacity: number | undefined,
): number {
  if (areaOpacity != null) {
    return areaOpacity;
  }
  if (mode === 'overlay') {
    return 0.35;
  }
  if (mode === 'stream') {
    return 0.85;
  }
  return 0.75;
}

/**
 * Streamgraph via centered stacked areas (baseline at −Σ/2).
 * Avoids ECharts ThemeRiver + category singleAxis, which fails to layout reliably.
 * Markers / value labels match overlay, stacked, and percent modes.
 */
function buildStreamgraphOption(args: PixelChartAreaOptionArgs): EChartsCoreOption {
  const {
    series,
    categories: rawCategories,
    showValues,
    showMarkers = false,
    hiddenSeriesIds,
    palette = 'brand',
    autoLabelMaxCells = 24,
    xAxisName = '',
    yAxisName = '',
    valueSuffix = '',
    valueFormat = null,
    nullLabel = '—',
    locale,
    lineWidth = 2,
    areaOpacity,
    markerSize = 6,
    boundaryGap = true,
    gridLines = 'on',
    axisLines = 'on',
    plotPadding,
    axisPointer = 'line',
    referenceLines = null,
    referenceBands = null,
  } = args;

  const categories = normalizeCategoryLabels(rawCategories);
  const colors = resolvePixelChartPaletteColors(palette);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const catCount = categories.length;
  const valueMatrix = visible.map((s) => seriesValuesForCategories(s, categories));
  const showLabel = resolveShowLabel(showValues, visible.length, catCount, autoLabelMaxCells);
  const fillOpacity = resolveAreaOpacity('stream', areaOpacity);

  const baseline: number[] = Array.from({ length: catCount }, (_, c) => {
    let sum = 0;
    for (const row of valueMatrix) {
      const v = row[c];
      if (v != null && Number.isFinite(v)) {
        sum += v;
      }
    }
    return -sum / 2;
  });

  const streamSeries: Record<string, unknown>[] = [
    {
      id: '__stream-baseline',
      name: '',
      type: 'line',
      stack: 'stream',
      data: baseline,
      silent: true,
      showSymbol: false,
      lineStyle: { width: 0, opacity: 0 },
      areaStyle: { opacity: 0 },
      itemStyle: { opacity: 0 },
      tooltip: { show: false },
      emphasis: { disabled: true },
      z: 0,
    },
    ...visible.map((s, index) => {
      const color = resolveStableItemColor(s, series, colors);
      return {
        id: s.id,
        name: s.name,
        type: 'line' as const,
        data: valueMatrix[index],
        stack: 'stream',
        smooth: true,
        itemStyle: { color },
        lineStyle: { width: lineWidth, color },
        areaStyle: {
          opacity: fillOpacity,
          color,
        },
        ...areaSeriesPointChrome({
          showLabel,
          showMarkers,
          percent: false,
          valueSuffix,
          markerSize,
          valueFormat,
          locale,
          nullLabel,
        }),
        z: 1 + index,
      };
    }),
  ];

  const withZoom = withDataZoom(
    {
      grid: resolveCartesianGrid(
        defaultCartesianGrid({ xAxisName, yAxisName }),
        plotPadding,
      ),
      tooltip: {
        trigger: 'axis',
        ...axisPointerFields(axisPointer, 'line'),
        valueFormatter: (value: unknown) =>
          formatChartValue(value, false, {
            suffix: valueSuffix,
            format: valueFormat,
            locale,
            nullLabel,
          }),
      },
      legend: { show: false },
      xAxis: {
        type: 'category',
        data: [...categories],
        boundaryGap,
        axisTick: { alignWithLabel: true },
        axisLabel: { showMinLabel: true, showMaxLabel: true },
        ...axisLineFields(axisLines, 'x'),
        ...splitLineFields(gridLines, 'category', 'x'),
        ...axisNameFields(xAxisName),
      },
      yAxis: {
        type: 'value',
        // Stream is centered on 0; hide numeric noise unless debugging.
        axisLabel: { show: false },
        ...axisLineFields(axisLines, 'y'),
        ...splitLineFields(gridLines, 'value', 'y'),
        ...axisNameFields(yAxisName),
      },
      series: withSeriesReferences(streamSeries, {
        referenceLines,
        referenceBands,
        format: valueFormat,
        locale,
        valueSuffix,
        skipSeriesIds: new Set(['__stream-baseline']),
      }),
    },
    args.dataZoom === 'auto' || args.dataZoom == null
      ? resolveDataZoomMode('auto', categories.length, args.zoomThreshold)
      : args.dataZoom,
  );
  return withSeriesPerformance(
    withZoom,
    resolveChartPerformance(
      args.performance,
      countCartesianPoints(visible.length, catCount),
      { allowSampling: true },
    ),
  );
}

/**
 * Pure ECharts option builder for area charts (line + areaStyle).
 * Call `ensureAreaChart()` before rendering.
 * `stream` is a centered stacked streamgraph (experimental).
 */
export function buildAreaChartOption(args: PixelChartAreaOptionArgs): EChartsCoreOption {
  if (args.mode === 'stream') {
    return buildStreamgraphOption(args);
  }

  const {
    series,
    categories: rawCategories,
    mode,
    showValues,
    showMarkers = false,
    hiddenSeriesIds,
    palette = 'brand',
    autoLabelMaxCells = 24,
    xAxisName = '',
    yAxisName = '',
    valueSuffix = '',
    valueFormat = null,
    axisValueFormat = null,
    nullLabel = '—',
    locale,
    lineWidth = 2,
    areaOpacity,
    markerSize = 6,
    boundaryGap = true,
    gridLines = 'on',
    axisLines = 'on',
    plotPadding,
    axisPointer = 'line',
    referenceLines = null,
    referenceBands = null,
  } = args;

  const categories = normalizeCategoryLabels(rawCategories);
  const colors = resolvePixelChartPaletteColors(palette);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const catCount = categories.length;
  const valueMatrix = visible.map((s) => seriesValuesForCategories(s, categories));
  const dataMatrix =
    mode === 'percent' ? toPercentStacks(valueMatrix) : valueMatrix.map((row) => [...row]);
  const showLabel = resolveShowLabel(showValues, visible.length, catCount, autoLabelMaxCells);
  const stacked = mode === 'stacked' || mode === 'percent';
  const percent = mode === 'percent';
  const fillOpacity = resolveAreaOpacity(mode, areaOpacity);
  const withZoom = withDataZoom(
    {
      grid: resolveCartesianGrid(
        defaultCartesianGrid({ xAxisName, yAxisName }),
        plotPadding,
      ),
      tooltip: {
        trigger: 'axis',
        ...axisPointerFields(axisPointer, 'line'),
        valueFormatter: (value: unknown) =>
          formatChartValue(value, percent, {
            suffix: valueSuffix,
            format: valueFormat,
            locale,
            nullLabel,
          }),
      },
      legend: { show: false },
      xAxis: {
        type: 'category',
        data: [...categories],
        boundaryGap,
        axisTick: { alignWithLabel: true },
        axisLabel: { showMinLabel: true, showMaxLabel: true },
        ...axisLineFields(axisLines, 'x'),
        ...splitLineFields(gridLines, 'category', 'x'),
        ...axisNameFields(xAxisName),
      },
      yAxis: {
        type: 'value',
        max: percent ? 100 : undefined,
        ...valueAxisLabelFields({
          percent,
          axisValueFormat,
          valueFormat,
          valueSuffix,
          locale,
        }),
        ...axisLineFields(axisLines, 'y'),
        ...splitLineFields(gridLines, 'value', 'y'),
        ...axisNameFields(yAxisName),
      },
      series: withSeriesReferences(
        visible.map((s, index) => {
          const color = resolveStableItemColor(s, series, colors);
          return {
            id: s.id,
            name: s.name,
            type: 'line' as const,
            data: dataMatrix[index],
            stack: stacked ? 'pixel' : undefined,
            smooth: true,
            itemStyle: { color },
            lineStyle: {
              width: lineWidth,
              color,
            },
            areaStyle: {
              opacity: fillOpacity,
              color,
            },
            ...areaSeriesPointChrome({
              showLabel,
              showMarkers,
              percent,
              valueSuffix,
              markerSize,
              valueFormat,
              locale,
              nullLabel,
            }),
          };
        }),
        {
          referenceLines,
          referenceBands,
          format: valueFormat,
          locale,
          valueSuffix,
        },
      ),
    },
    args.dataZoom === 'auto' || args.dataZoom == null
      ? resolveDataZoomMode('auto', categories.length, args.zoomThreshold)
      : args.dataZoom,
  );
  return withSeriesPerformance(
    withZoom,
    resolveChartPerformance(
      args.performance,
      countCartesianPoints(visible.length, catCount),
      { allowSampling: true },
    ),
  );
}
