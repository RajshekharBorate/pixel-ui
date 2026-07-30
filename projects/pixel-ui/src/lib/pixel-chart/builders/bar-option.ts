import type { EChartsCoreOption } from 'echarts/core';
import type { PixelChartSeries, PixelChartShowValues } from '../pixel-chart.types';
import {
  axisNameFields,
  formatChartValue,
  resolveShowLabel,
} from './cartesian-utils';
import { withPatternFills } from './pattern-fills';
import {
  resolveDataZoomMode,
  withDataZoom,
  type PixelChartDataZoomMode,
} from './interaction-option';
import {
  countCartesianPoints,
  resolveChartPerformance,
  withSeriesPerformance,
  type PixelChartPerformanceMode,
} from './performance-option';
import { normalizeCategoryLabels, type PixelChartAxisValue } from './time-axis';

export type PixelChartBarMode = 'single' | 'grouped' | 'stacked' | 'percent';
export type PixelChartBarOrientation = 'vertical' | 'horizontal';

export type PixelChartBarOptionArgs = {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly PixelChartAxisValue[];
  readonly mode: PixelChartBarMode;
  readonly orientation: PixelChartBarOrientation;
  readonly showValues: PixelChartShowValues;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  /** Soft cap before `showValues: 'auto'` hides labels. */
  readonly autoLabelMaxCells?: number;
  /** Hatch decals for high-contrast / color-blind friendly fills. */
  readonly patternFill?: boolean;
  readonly dataZoom?: PixelChartDataZoomMode | 'auto';
  readonly zoomThreshold?: number;
  readonly performance?: PixelChartPerformanceMode;
  /** Optional X-axis title (e.g. `Quarter`). */
  readonly xAxisName?: string;
  /** Optional Y-axis title (e.g. `Sales (in K)`). */
  readonly yAxisName?: string;
  /**
   * Suffix appended to absolute value labels / tooltips (e.g. `K` → `85K`).
   * Ignored in `percent` mode (those use `%`).
   */
  readonly valueSuffix?: string;
};

function seriesValues(
  series: PixelChartSeries,
  categories: readonly string[],
): (number | null)[] {
  const categoryCount = categories.length;
  const raw = series.data;
  if (raw.length === 0) {
    return Array.from({ length: categoryCount }, () => null);
  }
  if (typeof raw[0] === 'number' || raw[0] === null) {
    const nums = raw as readonly (number | null)[];
    return Array.from({ length: categoryCount }, (_, i) =>
      i < nums.length ? nums[i]! : null,
    );
  }
  const byX = new Map<string, number | null>();
  for (const point of raw as readonly { x: string | number | Date; y: number | null }[]) {
    byX.set(String(point.x), point.y);
  }
  return categories.map((cat, i) => byX.get(cat) ?? byX.get(String(i)) ?? null);
}

function toPercentStacks(
  matrix: readonly (readonly (number | null)[])[],
): (number | null)[][] {
  const cols = matrix[0]?.length ?? 0;
  const out = matrix.map((row) => row.map((v) => v));
  for (let c = 0; c < cols; c++) {
    let sum = 0;
    for (const row of matrix) {
      const v = row[c];
      if (v != null && Number.isFinite(v)) {
        sum += v;
      }
    }
    for (let r = 0; r < matrix.length; r++) {
      const v = matrix[r]![c];
      out[r]![c] = sum > 0 && v != null ? (v / sum) * 100 : v == null ? null : 0;
    }
  }
  return out;
}

/**
 * Pure ECharts option builder for bar / column charts.
 * Call `ensureBarChart()` before rendering.
 */
export function buildBarChartOption(args: PixelChartBarOptionArgs): EChartsCoreOption {
  const {
    series,
    categories: rawCategories,
    mode,
    orientation,
    showValues,
    hiddenSeriesIds,
    autoLabelMaxCells = 24,
    patternFill = false,
    xAxisName = '',
    yAxisName = '',
    valueSuffix = '',
  } = args;

  const categories = normalizeCategoryLabels(rawCategories);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const catCount = categories.length;
  const valueMatrix = visible.map((s) => seriesValues(s, categories));
  const dataMatrix =
    mode === 'percent' ? toPercentStacks(valueMatrix) : valueMatrix.map((row) => [...row]);

  const showLabel = resolveShowLabel(showValues, visible.length, catCount, autoLabelMaxCells);
  const stacked = mode === 'stacked' || mode === 'percent';
  const percent = mode === 'percent';
  const isHorizontal = orientation === 'horizontal';
  // Stacked segment labels stay inside the bar so the final segment cannot
  // collide with the total label rendered just outside the stack.
  const labelPosition = stacked ? 'inside' : isHorizontal ? 'right' : 'top';
  const formatBarLabel = (params: { value?: number | null }): string => {
    const v = params.value;
    if (v == null || Number.isNaN(Number(v))) {
      return '';
    }
    if (percent) {
      return `${Number(v).toFixed(0)}%`;
    }
    return formatChartValue(v, false, { suffix: valueSuffix });
  };
  const stackTotals = categories.map((_, categoryIndex) =>
    valueMatrix.reduce((total, row) => {
      const value = row[categoryIndex];
      return value != null && Number.isFinite(value) ? total + value : total;
    }, 0),
  );
  const dataSeries = visible.map((s, index) => ({
    id: s.id,
    name: s.name,
    type: 'bar' as const,
    data: dataMatrix[index],
    stack: stacked ? 'pixel' : undefined,
    barMaxWidth: 48,
    itemStyle: s.color ? { color: s.color } : undefined,
    label: {
      show: showLabel,
      position: labelPosition,
      formatter: formatBarLabel,
    },
    emphasis: {
      focus: 'series',
      label: {
        show: true,
        position: labelPosition,
        formatter: formatBarLabel,
      },
    },
  }));
  const totalSeries =
    mode === 'stacked' && showLabel
      ? [
          {
            id: '__stack-total',
            name: 'Total',
            type: 'bar' as const,
            data: stackTotals.map(() => 0),
            stack: 'pixel',
            barMaxWidth: 48,
            silent: true,
            tooltip: { show: false },
            itemStyle: { color: 'transparent' },
            label: {
              show: true,
              position: isHorizontal ? ('right' as const) : ('top' as const),
              distance: 6,
              formatter: (params: { dataIndex?: number }) => {
                const total = stackTotals[params.dataIndex ?? -1];
                return total == null
                  ? ''
                  : formatChartValue(total, false, { suffix: valueSuffix });
              },
            },
            emphasis: { disabled: true },
          },
        ]
      : [];

  const categoryAxis = {
    type: 'category' as const,
    data: [...categories],
    axisTick: { alignWithLabel: true },
    axisLabel: { showMinLabel: true, showMaxLabel: true },
    ...(isHorizontal ? axisNameFields(yAxisName) : axisNameFields(xAxisName)),
  };
  const valueAxis = {
    type: 'value' as const,
    max: percent ? 100 : undefined,
    axisLabel: percent ? { formatter: '{value}%' } : undefined,
    ...(isHorizontal ? axisNameFields(xAxisName) : axisNameFields(yAxisName)),
  };

  const withZoom = withDataZoom(
    withPatternFills(
      {
        grid: {
          left: isHorizontal ? (yAxisName.trim() ? 88 : 72) : yAxisName.trim() ? 64 : 48,
          right: 32,
          top: 32,
          bottom: xAxisName.trim() ? 56 : 40,
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          valueFormatter: (value: unknown) =>
            formatChartValue(value, percent, { suffix: valueSuffix }),
        },
        legend: { show: false },
        xAxis: isHorizontal ? valueAxis : categoryAxis,
        yAxis: isHorizontal ? categoryAxis : valueAxis,
        series: [...dataSeries, ...totalSeries],
      },
      patternFill,
    ),
    args.dataZoom === 'auto' || args.dataZoom == null
      ? resolveDataZoomMode('auto', catCount, args.zoomThreshold)
      : args.dataZoom,
  );
  return withSeriesPerformance(
    withZoom,
    resolveChartPerformance(
      args.performance,
      countCartesianPoints(visible.length, catCount),
      { allowSampling: false },
    ),
  );
}
