import type { EChartsCoreOption } from 'echarts/core';
import { resolvePixelChartPaletteColors } from '../pixel-chart-theme';
import type {
  PixelChartGridLines,
  PixelChartPalette,
  PixelChartSeries,
  PixelChartShowValues,
} from '../pixel-chart.types';
import { resolveStableItemColor } from './series-color';

export type PixelChartRadarMode =
  | 'line'
  | 'filled'
  | 'markers'
  | 'target'
  | 'range'
  | 'threshold'
  | 'polar-area';

export type PixelChartRadarIndicator = {
  readonly name: string;
  readonly max: number;
  readonly min?: number;
  /** Optional parent group — rendered as a second axis-label line (Phase 2). */
  readonly group?: string;
};

export type PixelChartRadarOptionArgs = {
  readonly indicators: readonly PixelChartRadarIndicator[];
  readonly series: readonly PixelChartSeries[];
  readonly mode?: PixelChartRadarMode;
  /** Value labels on vertices / polar bars. */
  readonly showValues?: PixelChartShowValues;
  /** Target overlay values (same length as indicators); used when mode is `target` or always shown if set. */
  readonly target?: readonly number[] | null;
  readonly targetName?: string;
  /** Lower bound of the acceptable band (`range` mode). */
  readonly rangeLow?: readonly number[] | null;
  /** Upper bound of the acceptable band (`range` mode). */
  readonly rangeHigh?: readonly number[] | null;
  /** Concentric threshold rings (`threshold` mode) — absolute values applied per indicator (clamped). */
  readonly thresholds?: readonly number[] | null;
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  readonly palette?: PixelChartPalette;
  /** Stroke width for radar outlines. @default 2 */
  readonly lineWidth?: number;
  /** Fill opacity for `filled` mode. @default 0.22 */
  readonly areaOpacity?: number;
  /** Vertex marker size when markers are shown. @default 8 */
  readonly markerSize?: number;
  /** Radial / concentric guides. @default 'on' */
  readonly gridLines?: PixelChartGridLines;
};

function resolveRadarShowLabel(
  showValues: PixelChartShowValues,
  seriesCount: number,
  indicatorCount: number,
): boolean {
  if (showValues === true) {
    return true;
  }
  if (showValues === false) {
    return false;
  }
  return seriesCount * indicatorCount <= 24;
}

function formatRadarValueLabel(params: { value?: number | number[] | null }): string {
  const raw = params.value;
  const v = Array.isArray(raw) ? raw[raw.length - 1] : raw;
  if (v == null || Number.isNaN(Number(v))) {
    return '';
  }
  return String(v);
}

const RANGE_FILL = 'rgba(21, 101, 192, 0.18)';
const THRESHOLD_COLORS = ['#b3261e', '#9a6700', '#146c2e'] as const;

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

function padValues(
  values: readonly number[] | null | undefined,
  count: number,
  fallback = 0,
): number[] {
  return Array.from({ length: count }, (_, i) => {
    const v = values?.[i];
    return v != null && Number.isFinite(v) ? v : fallback;
  });
}

/** Multi-level axis label: optional `group` above the indicator name. */
export function formatRadarIndicatorName(ind: PixelChartRadarIndicator): string {
  const group = ind.group?.trim();
  return group ? `${group}\n${ind.name}` : ind.name;
}

function buildPolarAreaOption(args: PixelChartRadarOptionArgs): EChartsCoreOption {
  const {
    indicators,
    series,
    showValues = 'auto',
    hiddenSeriesIds,
    palette = 'brand',
    gridLines = 'on',
  } = args;
  const colors = resolvePixelChartPaletteColors(palette);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const primary = visible[0];
  const values = primary
    ? seriesValues(primary, indicators.length)
    : Array.from({ length: indicators.length }, () => 0);
  const maxRadius = Math.max(...indicators.map((i) => i.max), 1);
  const showLabel = resolveRadarShowLabel(showValues, visible.length || 1, indicators.length);
  const showSplit = gridLines !== 'off';

  return {
    tooltip: { trigger: 'item' },
    legend: { show: false },
    polar: { radius: ['12%', '68%'] },
    angleAxis: {
      type: 'category',
      data: indicators.map(formatRadarIndicatorName),
      startAngle: 90,
      clockwise: true,
    },
    radiusAxis: {
      type: 'value',
      min: 0,
      max: maxRadius,
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: showSplit },
    },
    series: [
      {
        type: 'bar',
        id: primary?.id ?? 'polar-area',
        name: primary?.name ?? 'Values',
        coordinateSystem: 'polar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: primary?.color ?? colors[i % colors.length],
          },
        })),
        label: {
          show: showLabel,
          position: 'middle',
          formatter: formatRadarValueLabel,
        },
        emphasis: {
          focus: 'self',
          label: {
            show: true,
            position: 'middle',
            formatter: formatRadarValueLabel,
          },
        },
      },
    ],
  };
}

/**
 * Pure ECharts option builder for radar charts.
 * Call `ensureRadarChart()` before rendering.
 *
 * Multi-series is an overlay (not a stack) — documented API.
 * `polar-area` uses polar + bar (still registered via `ensureRadarChart`).
 */
export function buildRadarChartOption(args: PixelChartRadarOptionArgs): EChartsCoreOption {
  const {
    indicators,
    series,
    mode = 'line',
    showValues = 'auto',
    target = null,
    targetName = 'Target',
    rangeLow = null,
    rangeHigh = null,
    thresholds = null,
    hiddenSeriesIds,
    palette = 'brand',
    lineWidth = 2,
    areaOpacity = 0.22,
    markerSize = 8,
    gridLines = 'on',
  } = args;

  if (mode === 'polar-area') {
    return buildPolarAreaOption(args);
  }

  const colors = resolvePixelChartPaletteColors(palette);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));
  const showLabel = resolveRadarShowLabel(showValues, visible.length, indicators.length);

  const radarIndicators = indicators.map((ind) => ({
    name: formatRadarIndicatorName(ind),
    max: ind.max,
    min: ind.min ?? 0,
  }));

  const echartsSeries: Record<string, unknown>[] = [];

  if (mode === 'range') {
    const high = padValues(rangeHigh, indicators.length, 0);
    const low = padValues(rangeLow, indicators.length, 0);
    echartsSeries.push({
      type: 'radar',
      id: '__range-high',
      name: 'Range high',
      symbol: 'none',
      lineStyle: { width: 0, opacity: 0 },
      areaStyle: { color: RANGE_FILL, opacity: 1 },
      itemStyle: { color: colors[0] ?? '#1565c0' },
      data: [{ value: high, name: 'Range high' }],
      z: 1,
      silent: true,
    });
    echartsSeries.push({
      type: 'radar',
      id: '__range-low',
      name: 'Range low',
      symbol: 'none',
      lineStyle: { width: 1, type: 'dashed', color: colors[0] ?? '#1565c0', opacity: 0.5 },
      areaStyle: { color: 'transparent' },
      itemStyle: { color: colors[0] ?? '#1565c0' },
      data: [{ value: low, name: 'Range low' }],
      z: 2,
      silent: true,
    });
  }

  if (mode === 'threshold' && thresholds && thresholds.length > 0) {
    thresholds.forEach((level, ti) => {
      const values = indicators.map((ind) => {
        const max = ind.max || 1;
        const min = ind.min ?? 0;
        return Math.min(max, Math.max(min, level));
      });
      const color = THRESHOLD_COLORS[ti % THRESHOLD_COLORS.length]!;
      echartsSeries.push({
        type: 'radar',
        id: `__threshold-${ti}`,
        name: `Threshold ${level}`,
        symbol: 'none',
        lineStyle: { width: 2, type: 'dashed', color },
        areaStyle: undefined,
        itemStyle: { color },
        data: [{ value: values, name: `Threshold ${level}` }],
        z: 3 + ti,
        silent: true,
      });
    });
  }

  for (const [index, s] of visible.entries()) {
    const values = seriesValues(s, indicators.length);
    const seriesFilled = mode === 'filled';
    const defaultMarker =
      showLabel || mode === 'markers'
        ? markerSize
        : mode === 'range' || mode === 'line' || mode === 'target' || mode === 'filled'
          ? Math.min(4, markerSize)
          : 1;
    const seriesMarkerSize = Math.max(1, defaultMarker);
    const color = resolveStableItemColor(s, series, colors);
    echartsSeries.push({
      type: 'radar',
      id: s.id,
      name: s.name,
      symbol: 'circle',
      symbolSize: seriesMarkerSize,
      lineStyle: { width: lineWidth },
      areaStyle: seriesFilled
        ? {
            opacity: areaOpacity,
            color,
          }
        : undefined,
      itemStyle: { color },
      label: {
        show: showLabel,
        formatter: formatRadarValueLabel,
      },
      emphasis: {
        scale: true,
        label: {
          show: true,
          formatter: formatRadarValueLabel,
        },
      },
      data: [{ value: values, name: s.name }],
      z: 10 + index,
    });
  }

  const showTarget = mode === 'target' || (target != null && target.length > 0);
  if (showTarget && target && target.length > 0) {
    const values = padValues(target, indicators.length, 0);
    echartsSeries.push({
      type: 'radar',
      id: '__target',
      name: targetName,
      symbol: 'circle',
      symbolSize: Math.min(6, markerSize),
      lineStyle: {
        width: lineWidth,
        type: 'dashed',
        color: colors[1] ?? '#00897b',
      },
      itemStyle: { color: colors[1] ?? '#00897b' },
      areaStyle: undefined,
      data: [{ value: values, name: targetName }],
      z: 20,
    });
  }

  return {
    tooltip: { trigger: 'item' },
    legend: { show: false },
    radar: {
      indicator: radarIndicators,
      radius: '68%',
      splitNumber: mode === 'threshold' ? Math.max(4, thresholds?.length ?? 4) : 4,
      axisName: {
        lineHeight: 16,
      },
      splitArea: { show: true },
      splitLine: { show: gridLines !== 'off' },
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
    const row: Record<string, string | number | null> = {
      indicator: ind.group?.trim() ? `${ind.group} / ${ind.name}` : ind.name,
    };
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
