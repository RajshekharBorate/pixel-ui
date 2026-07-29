import {
  countCartesianPoints,
  resolveChartPerformance,
  withSeriesPerformance,
  type PixelChartPerformanceMode,
} from './performance-option';
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
import {
  formatChartAxisLabel,
  normalizeCategoryLabels,
  toChartTimestamp,
  type PixelChartAxisValue,
  type PixelChartXAxisType,
} from './time-axis';

export type PixelChartLineMode = 'straight' | 'smooth' | 'step';

export type PixelChartLineOptionArgs = {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly PixelChartAxisValue[];
  readonly mode: PixelChartLineMode;
  readonly showValues: PixelChartShowValues;
  readonly showMarkers?: boolean;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
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
    xAxisType = 'category',
    formatCategory,
  } = args;

  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const catCount = categories.length;
  const labelCats = normalizeCategoryLabels(categories, formatCategory);
  const valueMatrix = visible.map((s) => seriesValuesForCategories(s, labelCats));
  const showLabel = resolveShowLabel(showValues, visible.length, catCount, autoLabelMaxCells);

  const smooth = mode === 'smooth';
  const step = mode === 'step' ? ('start' as const) : undefined;
  const useTime =
    xAxisType === 'time' && categories.every((c) => toChartTimestamp(c) != null);

  const base: EChartsCoreOption = {
    grid: {
      left: 48,
      right: 32,
      top: 32,
      bottom: 40,
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: unknown) => formatChartValue(value, false),
    },
    legend: { show: false },
    xAxis: useTime
      ? {
          type: 'time',
          axisLabel: {
            hideOverlap: true,
            formatter: (value: number) =>
              formatCategory
                ? formatCategory(value)
                : formatChartAxisLabel(value),
          },
        }
      : {
          type: 'category',
          data: [...labelCats],
          boundaryGap: false,
          axisTick: { alignWithLabel: true },
          axisLabel: { showMinLabel: true, showMaxLabel: true },
        },
    yAxis: { type: 'value' },
    series: visible.map((s, index) => ({
      id: s.id,
      name: s.name,
      type: 'line' as const,
      data: useTime
        ? valueMatrix[index]!.map((y, i) => [toChartTimestamp(categories[i]!)!, y] as const)
        : valueMatrix[index],
      smooth,
      step,
      showSymbol: showMarkers && catCount < 200,
      symbolSize: 8,
      itemStyle: s.color ? { color: s.color } : undefined,
      lineStyle: s.color ? { color: s.color } : undefined,
      label: {
        show: showLabel,
        position: 'top',
        formatter: (params: { value?: number | null | (number | null)[] }) => {
          const raw = params.value;
          const v = Array.isArray(raw) ? raw[1] : raw;
          if (v == null || Number.isNaN(Number(v))) {
            return '';
          }
          return String(v);
        },
      },
      emphasis: { focus: 'series' },
    })),
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
