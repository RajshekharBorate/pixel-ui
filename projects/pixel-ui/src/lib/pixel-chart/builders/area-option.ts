import type { EChartsCoreOption } from 'echarts/core';
import type { PixelChartSeries, PixelChartShowValues } from '../pixel-chart.types';
import {
  formatChartValue,
  resolveShowLabel,
  seriesValuesForCategories,
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
import {
  normalizeCategoryLabels,
  type PixelChartAxisValue,
} from './time-axis';

export type PixelChartAreaMode = 'overlay' | 'stacked' | 'percent' | 'stream';

export type PixelChartAreaOptionArgs = {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly PixelChartAxisValue[];
  readonly mode: PixelChartAreaMode;
  readonly showValues: PixelChartShowValues;
  readonly showMarkers?: boolean;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
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
};

function axisNameFields(name: string | undefined): Record<string, unknown> {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    return {};
  }
  return {
    name: trimmed,
    nameLocation: 'middle' as const,
    nameGap: 28,
  };
}

function formatAreaLabel(
  value: unknown,
  percent: boolean,
  suffix: string,
): string {
  if (value == null || value === '') {
    return '';
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return '';
  }
  if (percent) {
    return `${n.toFixed(0)}%`;
  }
  return formatChartValue(n, false, { suffix });
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
}): Record<string, unknown> {
  const { showLabel, showMarkers, percent, valueSuffix } = args;
  return {
    // Keep hover markers when both are off; persist symbols when either is on.
    showSymbol: showMarkers || showLabel,
    symbolSize: 6,
    label: {
      show: showLabel,
      position: 'top',
      distance: 6,
      formatter: (params: { value?: number | null }) =>
        formatAreaLabel(params.value, percent, valueSuffix),
    },
    emphasis: {
      focus: 'series',
      label: {
        show: true,
        position: 'top',
        distance: 6,
        formatter: (params: { value?: number | null }) =>
          formatAreaLabel(params.value, percent, valueSuffix),
      },
    },
  };
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
    autoLabelMaxCells = 24,
    xAxisName = '',
    yAxisName = '',
    valueSuffix = '',
  } = args;

  const categories = normalizeCategoryLabels(rawCategories);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const catCount = categories.length;
  const valueMatrix = visible.map((s) => seriesValuesForCategories(s, categories));
  const showLabel = resolveShowLabel(showValues, visible.length, catCount, autoLabelMaxCells);

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
    ...visible.map((s, index) => ({
      id: s.id,
      name: s.name,
      type: 'line' as const,
      data: valueMatrix[index],
      stack: 'stream',
      smooth: true,
      itemStyle: s.color ? { color: s.color } : undefined,
      lineStyle: { width: 1, color: s.color },
      areaStyle: {
        opacity: 0.85,
        color: s.color,
      },
      ...areaSeriesPointChrome({
        showLabel,
        showMarkers,
        percent: false,
        valueSuffix,
      }),
      z: 1 + index,
    })),
  ];

  const withZoom = withDataZoom(
    {
      grid: {
        left: yAxisName.trim() ? 64 : 48,
        right: 32,
        top: 32,
        bottom: xAxisName.trim() ? 56 : 40,
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) =>
          formatChartValue(value, false, { suffix: valueSuffix }),
      },
      legend: { show: false },
      xAxis: {
        type: 'category',
        data: [...categories],
        boundaryGap: false,
        axisTick: { alignWithLabel: true },
        axisLabel: { showMinLabel: true, showMaxLabel: true },
        ...axisNameFields(xAxisName),
      },
      yAxis: {
        type: 'value',
        // Stream is centered on 0; hide numeric noise unless debugging.
        axisLabel: { show: false },
        splitLine: { show: true },
        ...axisNameFields(yAxisName),
      },
      series: streamSeries,
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
    autoLabelMaxCells = 24,
    xAxisName = '',
    yAxisName = '',
    valueSuffix = '',
  } = args;

  const categories = normalizeCategoryLabels(rawCategories);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const catCount = categories.length;
  const valueMatrix = visible.map((s) => seriesValuesForCategories(s, categories));
  const dataMatrix =
    mode === 'percent' ? toPercentStacks(valueMatrix) : valueMatrix.map((row) => [...row]);
  const showLabel = resolveShowLabel(showValues, visible.length, catCount, autoLabelMaxCells);
  const stacked = mode === 'stacked' || mode === 'percent';
  const percent = mode === 'percent';
  const withZoom = withDataZoom(
    {
      grid: {
        left: yAxisName.trim() ? 64 : 48,
        right: 32,
        top: 32,
        bottom: xAxisName.trim() ? 56 : 40,
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) =>
          formatChartValue(value, percent, { suffix: valueSuffix }),
      },
      legend: { show: false },
      xAxis: {
        type: 'category',
        data: [...categories],
        boundaryGap: false,
        axisTick: { alignWithLabel: true },
        axisLabel: { showMinLabel: true, showMaxLabel: true },
        ...axisNameFields(xAxisName),
      },
      yAxis: {
        type: 'value',
        max: percent ? 100 : undefined,
        axisLabel: percent ? { formatter: '{value}%' } : undefined,
        ...axisNameFields(yAxisName),
      },
      series: visible.map((s, index) => ({
        id: s.id,
        name: s.name,
        type: 'line' as const,
        data: dataMatrix[index],
        stack: stacked ? 'pixel' : undefined,
        smooth: true,
        itemStyle: s.color ? { color: s.color } : undefined,
        lineStyle: s.color ? { color: s.color } : undefined,
        areaStyle: {
          opacity: mode === 'overlay' ? 0.35 : 0.75,
          color: s.color,
        },
        ...areaSeriesPointChrome({
          showLabel,
          showMarkers,
          percent,
          valueSuffix,
        }),
      })),
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
