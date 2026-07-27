import type { EChartsCoreOption } from 'echarts/core';
import type { PixelChartSeries, PixelChartShowValues } from '../pixel-chart.types';
import {
  formatChartValue,
  resolveShowLabel,
  seriesValuesForCategories,
  toPercentStacks,
} from './cartesian-utils';

export type PixelChartAreaMode = 'overlay' | 'stacked' | 'percent';

export type PixelChartAreaOptionArgs = {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly string[];
  readonly mode: PixelChartAreaMode;
  readonly showValues: PixelChartShowValues;
  readonly showMarkers?: boolean;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  readonly autoLabelMaxCells?: number;
};

/**
 * Pure ECharts option builder for area charts (line + areaStyle).
 * Call `ensureAreaChart()` / `ensureLineChart()` before rendering.
 * Streamgraph (`mode: 'stream'`) is Phase 2 — not built here.
 */
export function buildAreaChartOption(args: PixelChartAreaOptionArgs): EChartsCoreOption {
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

  return {
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
  };
}
