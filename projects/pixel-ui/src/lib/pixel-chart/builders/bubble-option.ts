import type { EChartsCoreOption } from 'echarts/core';
import { resolvePixelChartPaletteColors } from '../pixel-chart-theme';
import type { PixelChartPalette, PixelChartPoint, PixelChartSeries } from '../pixel-chart.types';

export type PixelChartBubblePoint = {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly label?: string;
};

export type PixelChartBubbleSeries = {
  readonly id: string;
  readonly name: string;
  readonly data: readonly PixelChartBubblePoint[];
  readonly color?: string;
};

export type PixelChartBubbleOptionArgs = {
  readonly series: readonly PixelChartBubbleSeries[];
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  readonly palette?: PixelChartPalette;
  readonly xAxisName?: string;
  readonly yAxisName?: string;
  /** Symbol size range [minPx, maxPx]. */
  readonly sizeRange?: readonly [number, number];
};

function normalizeBubbleSeries(
  series: readonly PixelChartBubbleSeries[] | readonly PixelChartSeries[],
): PixelChartBubbleSeries[] {
  return series.map((s) => {
    if ('data' in s && s.data.length > 0 && typeof (s.data[0] as PixelChartBubblePoint).size === 'number') {
      return s as PixelChartBubbleSeries;
    }
    const data: PixelChartBubblePoint[] = [];
    for (const raw of s.data as readonly PixelChartPoint[] | readonly number[]) {
      if (typeof raw === 'number' || raw === null) {
        continue;
      }
      const p = raw as PixelChartPoint;
      const x = typeof p.x === 'number' ? p.x : Number(p.x);
      const y = p.y;
      const size = p.size ?? 1;
      if (Number.isFinite(x) && y != null && Number.isFinite(y) && Number.isFinite(size)) {
        data.push({ x, y, size, label: p.label });
      }
    }
    return { id: s.id, name: s.name, data, color: s.color };
  });
}

/**
 * Pure ECharts option builder for cartesian bubble charts.
 * Call `ensureBubbleChart()` before rendering.
 */
export function buildBubbleChartOption(args: PixelChartBubbleOptionArgs): EChartsCoreOption {
  const {
    hiddenSeriesIds,
    palette = 'brand',
    xAxisName = '',
    yAxisName = '',
    sizeRange = [8, 48],
  } = args;

  const series = normalizeBubbleSeries(args.series);
  const colors = resolvePixelChartPaletteColors(palette);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));

  let minSize = Infinity;
  let maxSize = -Infinity;
  for (const s of visible) {
    for (const p of s.data) {
      if (p.size < minSize) minSize = p.size;
      if (p.size > maxSize) maxSize = p.size;
    }
  }
  if (!Number.isFinite(minSize)) {
    minSize = 0;
    maxSize = 1;
  }
  const span = maxSize - minSize || 1;
  const [symMin, symMax] = sizeRange;

  const mapSize = (size: number) =>
    symMin + ((size - minSize) / span) * (symMax - symMin);

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as {
          seriesName?: string;
          value?: number[];
          data?: { label?: string };
        };
        const v = p.value;
        if (!v || v.length < 3) {
          return p.seriesName ?? '';
        }
        const label = p.data?.label ? `<br/>${p.data.label}` : '';
        return `${p.seriesName ?? ''}${label}<br/>x: ${v[0]}<br/>y: ${v[1]}<br/>size: ${v[2]}`;
      },
    },
    legend: { show: false },
    grid: { left: 48, right: 24, top: 24, bottom: 48, containLabel: true },
    xAxis: {
      type: 'value',
      name: xAxisName,
      nameLocation: 'middle',
      nameGap: 28,
      splitLine: { show: true },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameLocation: 'middle',
      nameGap: 36,
      splitLine: { show: true },
    },
    series: visible.map((s, index) => ({
      type: 'scatter',
      id: s.id,
      name: s.name,
      itemStyle: { color: s.color ?? colors[index % colors.length], opacity: 0.75 },
      symbolSize: (val: number[]) => mapSize(val[2] ?? 1),
      data: s.data.map((p) => ({
        value: [p.x, p.y, p.size],
        label: p.label,
      })),
    })),
  };
}

export function bubbleSeriesToLegendSeries(
  series: readonly PixelChartBubbleSeries[],
): PixelChartSeries[] {
  return series.map((s) => ({
    id: s.id,
    name: s.name,
    data: s.data.map((p) => p.size),
    color: s.color,
  }));
}

export function buildBubbleTable(series: readonly PixelChartBubbleSeries[]): {
  columns: { key: string; header: string }[];
  rows: Readonly<Record<string, string | number | null>>[];
} {
  const rows: Readonly<Record<string, string | number | null>>[] = [];
  for (const s of series) {
    for (const p of s.data) {
      rows.push({
        series: s.name,
        label: p.label ?? '',
        x: p.x,
        y: p.y,
        size: p.size,
      });
    }
  }
  return {
    columns: [
      { key: 'series', header: 'Series' },
      { key: 'label', header: 'Label' },
      { key: 'x', header: 'X' },
      { key: 'y', header: 'Y' },
      { key: 'size', header: 'Size' },
    ],
    rows,
  };
}
