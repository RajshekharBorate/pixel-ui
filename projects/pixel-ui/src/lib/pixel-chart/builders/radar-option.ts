import type { EChartsCoreOption } from 'echarts/core';
import { resolvePixelChartPaletteColors } from '../pixel-chart-theme';
import type { PixelChartPalette, PixelChartSeries } from '../pixel-chart.types';

export type PixelChartRadarMode = 'line' | 'filled' | 'markers' | 'target';

export type PixelChartRadarIndicator = {
  readonly name: string;
  readonly max: number;
  readonly min?: number;
};

export type PixelChartRadarOptionArgs = {
  readonly indicators: readonly PixelChartRadarIndicator[];
  readonly series: readonly PixelChartSeries[];
  readonly mode?: PixelChartRadarMode;
  /** Target overlay values (same length as indicators); used when mode is `target` or always shown if set. */
  readonly target?: readonly number[] | null;
  readonly targetName?: string;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  readonly palette?: PixelChartPalette;
};

function seriesValues(
  series: PixelChartSeries,
  indicatorCount: number,
): number[] {
  const raw = series.data;
  if (raw.length === 0) {
    return Array.from({ length: indicatorCount }, () => 0);
  }
  if (typeof raw[0] === 'number' || raw[0] === null) {
    const nums = raw as readonly (number | null)[];
    return Array.from({ length: indicatorCount }, (_, i) => {
      const v = nums[i];
      return v != null && Number.isFinite(v) ? v : 0;
    });
  }
  return Array.from({ length: indicatorCount }, (_, i) => {
    const p = (raw as readonly { y: number | null }[])[i];
    return p?.y != null && Number.isFinite(p.y) ? p.y : 0;
  });
}

/**
 * Pure ECharts option builder for radar charts.
 * Call `ensureRadarChart()` before rendering.
 *
 * Multi-series is an overlay (not a stack) — documented API.
 */
export function buildRadarChartOption(args: PixelChartRadarOptionArgs): EChartsCoreOption {
  const {
    indicators,
    series,
    mode = 'line',
    target = null,
    targetName = 'Target',
    hiddenSeriesIds,
    palette = 'brand',
  } = args;

  const colors = resolvePixelChartPaletteColors(palette);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const filled = mode === 'filled';
  const showMarkers = mode === 'markers' || mode === 'line' || mode === 'filled' || mode === 'target';
  const markerSize = mode === 'markers' ? 8 : mode === 'line' ? 4 : 0;

  const radarIndicators = indicators.map((ind) => ({
    name: ind.name,
    max: ind.max,
    min: ind.min ?? 0,
  }));

  const echartsSeries: Record<string, unknown>[] = visible.map((s, index) => {
    const values = seriesValues(s, indicators.length);
    return {
      type: 'radar',
      id: s.id,
      name: s.name,
      symbol: showMarkers && markerSize > 0 ? 'circle' : 'none',
      symbolSize: markerSize,
      lineStyle: { width: 2 },
      areaStyle: filled
        ? { opacity: 0.22, color: s.color ?? colors[index % colors.length] }
        : undefined,
      itemStyle: { color: s.color ?? colors[index % colors.length] },
      data: [{ value: values, name: s.name }],
    };
  });

  const showTarget = mode === 'target' || (target != null && target.length > 0);
  if (showTarget && target && target.length > 0) {
    const values = Array.from({ length: indicators.length }, (_, i) => {
      const v = target[i];
      return v != null && Number.isFinite(v) ? v : 0;
    });
    echartsSeries.push({
      type: 'radar',
      id: '__target',
      name: targetName,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, type: 'dashed', color: colors[1] ?? '#00897b' },
      itemStyle: { color: colors[1] ?? '#00897b' },
      areaStyle: undefined,
      data: [{ value: values, name: targetName }],
      z: 5,
    });
  }

  return {
    tooltip: { trigger: 'item' },
    legend: { show: false },
    radar: {
      indicator: radarIndicators,
      radius: '68%',
      splitNumber: 4,
      axisName: { color: undefined },
      splitArea: { show: true },
    },
    series: echartsSeries,
  };
}

export function buildRadarTable(
  indicators: readonly PixelChartRadarIndicator[],
  series: readonly PixelChartSeries[],
  target?: readonly number[] | null,
): {
  columns: { key: string; header: string }[];
  rows: Readonly<Record<string, string | number | null>>[];
} {
  const columns = [
    { key: 'indicator', header: 'Indicator' },
    ...series.map((s) => ({ key: s.id, header: s.name })),
    ...(target ? [{ key: 'target', header: 'Target' }] : []),
  ];
  const rows = indicators.map((ind, i) => {
    const row: Record<string, string | number | null> = { indicator: ind.name };
    for (const s of series) {
      const values = seriesValues(s, indicators.length);
      row[s.id] = values[i] ?? null;
    }
    if (target) {
      row['target'] = target[i] ?? null;
    }
    return row;
  });
  return { columns, rows };
}
