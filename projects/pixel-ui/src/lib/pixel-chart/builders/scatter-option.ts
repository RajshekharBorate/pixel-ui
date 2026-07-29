import type { EChartsCoreOption } from 'echarts/core';
import { resolvePixelChartPaletteColors } from '../pixel-chart-theme';
import type { PixelChartPalette, PixelChartPoint, PixelChartSeries } from '../pixel-chart.types';
import { computeScatterStats, type PixelChartRegressionStats } from './scatter-stats';
import {
  withDataZoom,
  resolveDataZoomMode,
  PIXEL_CHART_ZOOM_POINT_THRESHOLD,
  type PixelChartDataZoomMode,
} from './interaction-option';
import {
  resolveChartPerformance,
  withSeriesPerformance,
  type PixelChartPerformanceMode,
} from './performance-option';

export type { PixelChartRegressionStats };

export type PixelChartScatterOptionArgs = {
  readonly series: readonly PixelChartSeries[];
  readonly showTrendline?: boolean;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  readonly palette?: PixelChartPalette;
  /** X-axis name. */
  readonly xAxisName?: string;
  /** Y-axis name. */
  readonly yAxisName?: string;
  readonly dataZoom?: PixelChartDataZoomMode | 'auto';
  readonly zoomThreshold?: number;
  readonly performance?: PixelChartPerformanceMode;
};

function toNumericPoints(
  data: PixelChartSeries['data'],
): { x: number; y: number; label?: string }[] {
  const out: { x: number; y: number; label?: string }[] = [];
  if (data.length === 0) {
    return out;
  }
  if (typeof data[0] === 'number' || data[0] === null) {
    (data as readonly (number | null)[]).forEach((y, i) => {
      if (y != null && Number.isFinite(y)) {
        out.push({ x: i, y });
      }
    });
    return out;
  }
  for (const p of data as readonly PixelChartPoint[]) {
    const x = typeof p.x === 'number' ? p.x : Number(p.x);
    const y = p.y;
    if (Number.isFinite(x) && y != null && Number.isFinite(y)) {
      out.push({ x, y, label: p.label });
    }
  }
  return out;
}

/** Flatten visible series points for stats / trendline (primary series or all). */
export function collectScatterPoints(
  series: readonly PixelChartSeries[],
  hiddenSeriesIds?: ReadonlySet<string>,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (const s of series) {
    if (hiddenSeriesIds?.has(s.id)) {
      continue;
    }
    for (const p of toNumericPoints(s.data)) {
      points.push({ x: p.x, y: p.y });
    }
  }
  return points;
}

export function buildScatterStats(
  series: readonly PixelChartSeries[],
  hiddenSeriesIds?: ReadonlySet<string>,
): PixelChartRegressionStats | null {
  return computeScatterStats(collectScatterPoints(series, hiddenSeriesIds));
}

/**
 * Pure ECharts option builder for scatter charts.
 * Call `ensureScatterChart()` before rendering.
 */
export function buildScatterChartOption(args: PixelChartScatterOptionArgs): EChartsCoreOption {
  const {
    series,
    showTrendline = false,
    hiddenSeriesIds,
    palette = 'brand',
    xAxisName = '',
    yAxisName = '',
  } = args;

  const colors = resolvePixelChartPaletteColors(palette);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));

  const echartsSeries: Record<string, unknown>[] = visible.map((s, index) => {
    const pts = toNumericPoints(s.data);
    return {
      type: 'scatter',
      id: s.id,
      name: s.name,
      symbolSize: 10,
      itemStyle: { color: s.color ?? colors[index % colors.length] },
      data: pts.map((p) => [p.x, p.y]),
    };
  });

  if (showTrendline && visible.length > 0) {
    const stats = computeScatterStats(collectScatterPoints(visible));
    if (stats) {
      echartsSeries.push({
        type: 'line',
        id: '__trendline',
        name: 'Trend',
        showSymbol: false,
        silent: true,
        lineStyle: {
          type: 'dashed',
          width: 2,
          color: colors[0],
        },
        data: stats.trendline.map(([x, y]) => [x, y]),
        z: 5,
      });
    }
  }

  const pointCount = visible.reduce((n, s) => n + toNumericPoints(s.data).length, 0);

  const withZoom = withDataZoom(
    {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { seriesName?: string; value?: number[] };
          const v = p.value;
          if (!v || v.length < 2) {
            return p.seriesName ?? '';
          }
          return `${p.seriesName ?? ''}<br/>x: ${v[0]}<br/>y: ${v[1]}`;
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
      series: echartsSeries,
    },
    args.dataZoom === 'auto' || args.dataZoom == null
      ? resolveDataZoomMode(
          'auto',
          pointCount,
          args.zoomThreshold ?? PIXEL_CHART_ZOOM_POINT_THRESHOLD,
        )
      : args.dataZoom,
  );
  return withSeriesPerformance(
    withZoom,
    resolveChartPerformance(args.performance, pointCount, { allowSampling: false }),
    new Set(['__trendline']),
  );
}

export function buildScatterTable(series: readonly PixelChartSeries[]): {
  columns: { key: string; header: string }[];
  rows: Readonly<Record<string, string | number | null>>[];
} {
  const rows: Readonly<Record<string, string | number | null>>[] = [];
  for (const s of series) {
    for (const p of toNumericPoints(s.data)) {
      rows.push({
        series: s.name,
        x: p.x,
        y: p.y,
      });
    }
  }
  return {
    columns: [
      { key: 'series', header: 'Series' },
      { key: 'x', header: 'X' },
      { key: 'y', header: 'Y' },
    ],
    rows,
  };
}
