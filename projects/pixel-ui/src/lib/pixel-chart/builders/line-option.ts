import type { EChartsCoreOption } from 'echarts/core';
import type { PixelChartSeries, PixelChartShowValues } from '../pixel-chart.types';
import {
  formatChartValue,
  resolveShowLabel,
  seriesValuesForCategories,
} from './cartesian-utils';
import {
  withDataZoom,
  resolveDataZoomMode,
  type PixelChartDataZoomMode,
} from './interaction-option';

export type PixelChartLineMode = 'straight' | 'smooth' | 'step';

export type PixelChartLineOptionArgs = {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly string[];
  readonly mode: PixelChartLineMode;
  readonly showValues: PixelChartShowValues;
  readonly showMarkers?: boolean;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  readonly autoLabelMaxCells?: number;
  /** Zoom mode. Prefer `'auto'` / `'selection'` for large category sets. */
  readonly dataZoom?: PixelChartDataZoomMode | 'auto';
  readonly zoomThreshold?: number;
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
    autoLabelMaxCells = 24,
  } = args;

  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const catCount = categories.length;
  const valueMatrix = visible.map((s) => seriesValuesForCategories(s, categories));
  const showLabel = resolveShowLabel(showValues, visible.length, catCount, autoLabelMaxCells);

  const smooth = mode === 'smooth';
  const step = mode === 'step' ? ('start' as const) : undefined;

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
      yAxis: { type: 'value' },
      series: visible.map((s, index) => ({
        id: s.id,
        name: s.name,
        type: 'line' as const,
        data: valueMatrix[index],
        smooth,
        step,
        showSymbol: showMarkers,
        symbolSize: 8,
        itemStyle: s.color ? { color: s.color } : undefined,
        lineStyle: s.color ? { color: s.color } : undefined,
        label: {
          show: showLabel,
          position: 'top',
          formatter: (params: { value?: number | null }) => {
            const v = params.value;
            if (v == null || Number.isNaN(Number(v))) {
              return '';
            }
            return String(v);
          },
        },
        emphasis: { focus: 'series' },
      })),
    },
    args.dataZoom === 'auto' || args.dataZoom == null
      ? resolveDataZoomMode('auto', catCount, args.zoomThreshold)
      : args.dataZoom,
  );
}
