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

export type PixelChartAreaMode = 'overlay' | 'stacked' | 'percent' | 'stream';

export type PixelChartAreaOptionArgs = {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly string[];
  readonly mode: PixelChartAreaMode;
  readonly showValues: PixelChartShowValues;
  readonly showMarkers?: boolean;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  readonly autoLabelMaxCells?: number;
  readonly dataZoom?: PixelChartDataZoomMode | 'auto';
  readonly zoomThreshold?: number;
};

/**
 * Streamgraph via centered stacked areas (baseline at −Σ/2).
 * Avoids ECharts ThemeRiver + category singleAxis, which fails to layout reliably.
 */
function buildStreamgraphOption(args: PixelChartAreaOptionArgs): EChartsCoreOption {
  const {
    series,
    categories,
    showValues,
    showMarkers = false,
    hiddenSeriesIds,
    autoLabelMaxCells = 24,
  } = args;

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
      showSymbol: showMarkers,
      symbolSize: 6,
      itemStyle: s.color ? { color: s.color } : undefined,
      lineStyle: { width: 1, color: s.color },
      areaStyle: {
        opacity: 0.85,
        color: s.color,
      },
      label: {
        show: showLabel,
        position: 'inside',
        formatter: (params: { value?: number | null }) => {
          const v = params.value;
          if (v == null || Number.isNaN(Number(v))) {
            return '';
          }
          return String(v);
        },
      },
      emphasis: { focus: 'series' },
      z: 1 + index,
    })),
  ];

  return withDataZoom(
    {
      grid: {
        left: 48,
        right: 24,
        top: 32,
        bottom: 40,
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) => formatChartValue(value, false),
      },
      legend: { show: false },
      xAxis: {
        type: 'category',
        data: [...categories],
        boundaryGap: false,
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        // Stream is centered on 0; hide numeric noise unless debugging.
        axisLabel: { show: false },
        splitLine: { show: true },
      },
      series: streamSeries,
    },
    args.dataZoom === 'auto' || args.dataZoom == null
      ? resolveDataZoomMode('auto', categories.length, args.zoomThreshold)
      : args.dataZoom,
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
    categories,
    mode,
    showValues,
    showMarkers = false,
    hiddenSeriesIds,
    autoLabelMaxCells = 24,
  } = args;

  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const catCount = categories.length;
  const valueMatrix = visible.map((s) => seriesValuesForCategories(s, categories));
  const dataMatrix =
    mode === 'percent' ? toPercentStacks(valueMatrix) : valueMatrix.map((row) => [...row]);
  const showLabel = resolveShowLabel(showValues, visible.length, catCount, autoLabelMaxCells);
  const stacked = mode === 'stacked' || mode === 'percent';

  return withDataZoom(
    {
      grid: {
        left: 48,
        right: 24,
        top: 32,
        bottom: 40,
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) => formatChartValue(value, mode === 'percent'),
      },
      legend: { show: false },
      xAxis: {
        type: 'category',
        data: [...categories],
        boundaryGap: false,
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        max: mode === 'percent' ? 100 : undefined,
        axisLabel: mode === 'percent' ? { formatter: '{value}%' } : undefined,
      },
      series: visible.map((s, index) => ({
        id: s.id,
        name: s.name,
        type: 'line' as const,
        data: dataMatrix[index],
        stack: stacked ? 'pixel' : undefined,
        smooth: true,
        showSymbol: showMarkers,
        symbolSize: 6,
        itemStyle: s.color ? { color: s.color } : undefined,
        lineStyle: s.color ? { color: s.color } : undefined,
        areaStyle: {
          opacity: mode === 'overlay' ? 0.35 : 0.75,
          color: s.color,
        },
        label: {
          show: showLabel,
          position: stacked ? 'inside' : 'top',
          formatter: (params: { value?: number | null }) => {
            const v = params.value;
            if (v == null || Number.isNaN(Number(v))) {
              return '';
            }
            return mode === 'percent' ? `${Number(v).toFixed(0)}%` : String(v);
          },
        },
        emphasis: { focus: 'series' },
      })),
    },
    args.dataZoom === 'auto' || args.dataZoom == null
      ? resolveDataZoomMode('auto', categories.length, args.zoomThreshold)
      : args.dataZoom,
  );
}
