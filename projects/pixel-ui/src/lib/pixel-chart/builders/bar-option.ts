import type { EChartsCoreOption } from 'echarts/core';
import type { PixelChartSeries, PixelChartShowValues } from '../pixel-chart.types';

export type PixelChartBarMode = 'single' | 'grouped' | 'stacked' | 'percent';
export type PixelChartBarOrientation = 'vertical' | 'horizontal';

export type PixelChartBarOptionArgs = {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly string[];
  readonly mode: PixelChartBarMode;
  readonly orientation: PixelChartBarOrientation;
  readonly showValues: PixelChartShowValues;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  /** Soft cap before `showValues: 'auto'` hides labels. */
  readonly autoLabelMaxCells?: number;
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

function resolveShowLabel(
  showValues: PixelChartShowValues,
  seriesCount: number,
  categoryCount: number,
  autoLabelMaxCells: number,
): boolean {
  if (showValues === true) {
    return true;
  }
  if (showValues === false) {
    return false;
  }
  return seriesCount * categoryCount <= autoLabelMaxCells;
}

/**
 * Pure ECharts option builder for bar / column charts.
 * Call `ensureBarChart()` before rendering.
 */
export function buildBarChartOption(args: PixelChartBarOptionArgs): EChartsCoreOption {
  const {
    series,
    categories,
    mode,
    orientation,
    showValues,
    hiddenSeriesIds,
    autoLabelMaxCells = 24,
  } = args;

  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const catCount = categories.length;
  const valueMatrix = visible.map((s) => seriesValues(s, categories));
  const dataMatrix =
    mode === 'percent' ? toPercentStacks(valueMatrix) : valueMatrix.map((row) => [...row]);

  const showLabel = resolveShowLabel(showValues, visible.length, catCount, autoLabelMaxCells);
  const stacked = mode === 'stacked' || mode === 'percent';
  const isHorizontal = orientation === 'horizontal';

  const categoryAxis = {
    type: 'category' as const,
    data: [...categories],
    axisTick: { alignWithLabel: true },
  };
  const valueAxis = {
    type: 'value' as const,
    max: mode === 'percent' ? 100 : undefined,
    axisLabel: mode === 'percent' ? { formatter: '{value}%' } : undefined,
  };

  return {
    grid: {
      left: isHorizontal ? 72 : 48,
      right: 24,
      top: 32,
      bottom: 40,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: unknown) => {
        if (value == null || value === '') {
          return '—';
        }
        const n = Number(value);
        if (!Number.isFinite(n)) {
          return String(value);
        }
        return mode === 'percent' ? `${n.toFixed(1)}%` : String(n);
      },
    },
    legend: { show: false },
    xAxis: isHorizontal ? valueAxis : categoryAxis,
    yAxis: isHorizontal ? categoryAxis : valueAxis,
    series: visible.map((s, index) => ({
      id: s.id,
      name: s.name,
      type: 'bar' as const,
      data: dataMatrix[index],
      stack: stacked ? 'pixel' : undefined,
      barMaxWidth: 48,
      itemStyle: s.color ? { color: s.color } : undefined,
      label: {
        show: showLabel,
        position: isHorizontal ? 'right' : stacked ? 'inside' : 'top',
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
