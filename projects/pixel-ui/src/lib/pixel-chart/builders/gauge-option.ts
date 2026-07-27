import type { EChartsCoreOption } from 'echarts/core';
import { resolvePixelChartPaletteColors } from '../pixel-chart-theme';
import type { PixelChartPalette } from '../pixel-chart.types';

export type PixelChartGaugeVariant =
  | 'radial'
  | 'semi'
  | 'linear'
  | 'donut'
  | 'bullet';

export type PixelChartGaugeRange = {
  readonly from: number;
  readonly to: number;
  /** CSS color or leave empty to use palette / semantic tokens via builder. */
  readonly color?: string;
};

export type PixelChartGaugeOptionArgs = {
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly target?: number | null;
  readonly label?: string;
  readonly variant: PixelChartGaugeVariant;
  readonly ranges?: readonly PixelChartGaugeRange[];
  readonly palette?: PixelChartPalette;
  readonly showValue?: boolean;
};

/** Light-scheme fallbacks matching `--pixel-sys-error|warning|success`. */
const SEMANTIC_ERROR = '#b3261e';
const SEMANTIC_WARNING = '#9a6700';
const SEMANTIC_SUCCESS = '#146c2e';
const TRACK_MUTED = 'rgba(116, 119, 127, 0.22)';
const ON_SURFACE = '#1a1b1f';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function buildArcGauge(args: PixelChartGaugeOptionArgs): EChartsCoreOption {
  const min = args.min ?? 0;
  const max = args.max ?? 100;
  const value = clamp(args.value, min, max);
  const colors = resolvePixelChartPaletteColors(args.palette ?? 'brand');
  const primary = colors[0] ?? '#1565c0';
  const variant = args.variant;
  const isDonut = variant === 'donut';
  const isSemi = variant === 'semi' || variant === 'radial';
  const thick = variant === 'radial' ? 22 : variant === 'donut' ? 18 : 12;

  const startAngle = isDonut ? 90 : 210;
  const endAngle = isDonut ? -270 : -30;

  return {
    series: [
      {
        type: 'gauge',
        min,
        max,
        startAngle,
        endAngle,
        radius: isDonut ? '85%' : '95%',
        center: ['50%', isDonut ? '50%' : '55%'],
        progress: {
          show: true,
          width: thick,
          itemStyle: { color: primary },
        },
        axisLine: {
          lineStyle: {
            width: thick,
            color: [[1, TRACK_MUTED]],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: {
          show: !!args.label,
          offsetCenter: [0, isDonut ? '28%' : '30%'],
          fontSize: 13,
        },
        detail: {
          show: args.showValue !== false,
          valueAnimation: true,
          formatter: (v: number) => `${Math.round(v)}`,
          offsetCenter: [0, isDonut ? '0%' : '0%'],
          fontSize: 28,
          fontWeight: 600,
        },
        data: [{ value, name: args.label ?? '' }],
      },
    ],
  };
}

function buildLinearGauge(args: PixelChartGaugeOptionArgs): EChartsCoreOption {
  const min = args.min ?? 0;
  const max = args.max ?? 100;
  const value = clamp(args.value, min, max);
  const colors = resolvePixelChartPaletteColors(args.palette ?? 'brand');
  const primary = colors[0] ?? '#1565c0';
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return {
    grid: { left: 16, right: 16, top: 40, bottom: 24 },
    xAxis: { type: 'value', min: 0, max: 100, show: false },
    yAxis: { type: 'category', data: [args.label || ''], show: false },
    series: [
      {
        type: 'bar',
        data: [100],
        barWidth: 18,
        itemStyle: { color: TRACK_MUTED, borderRadius: 9 },
        silent: true,
        z: 1,
      },
      {
        type: 'bar',
        data: [pct],
        barWidth: 18,
        barGap: '-100%',
        itemStyle: { color: primary, borderRadius: 9 },
        label: {
          show: args.showValue !== false,
          position: 'right',
          formatter: () => `${Math.round(value)}${args.label ? ` ${args.label}` : ''}`,
          fontSize: 14,
          fontWeight: 600,
        },
        z: 2,
      },
    ],
  };
}

function buildBulletGauge(args: PixelChartGaugeOptionArgs): EChartsCoreOption {
  const min = args.min ?? 0;
  const max = args.max ?? 100;
  const value = clamp(args.value, min, max);
  const target = args.target ?? null;
  const colors = resolvePixelChartPaletteColors(args.palette ?? 'brand');
  const primary = colors[0] ?? '#1565c0';
  const defaultRangeColors = [SEMANTIC_ERROR, SEMANTIC_WARNING, SEMANTIC_SUCCESS];
  const ranges =
    args.ranges && args.ranges.length > 0
      ? args.ranges
      : [
          { from: min, to: min + (max - min) * 0.5, color: SEMANTIC_ERROR },
          { from: min + (max - min) * 0.5, to: min + (max - min) * 0.75, color: SEMANTIC_WARNING },
          { from: min + (max - min) * 0.75, to: max, color: SEMANTIC_SUCCESS },
        ];

  const span = max - min || 1;
  const toPct = (n: number) => ((n - min) / span) * 100;

  const rangeSeries = ranges.map((r, i) => ({
    type: 'bar' as const,
    stack: 'ranges',
    data: [toPct(r.to) - toPct(r.from)],
    barWidth: 22,
    itemStyle: {
      color: r.color ?? defaultRangeColors[i % defaultRangeColors.length],
      borderRadius: i === 0 ? [4, 0, 0, 4] : i === ranges.length - 1 ? [0, 4, 4, 0] : 0,
    },
    silent: true,
    z: 1,
  }));

  return {
    grid: { left: 16, right: 24, top: 36, bottom: 28 },
    xAxis: { type: 'value', min: 0, max: 100, show: false },
    yAxis: { type: 'category', data: [''], show: false },
    tooltip: { show: true },
    series: [
      ...rangeSeries,
      {
        type: 'bar',
        data: [0],
        barWidth: 22,
        itemStyle: { color: 'transparent' },
        markPoint: {
          symbol: 'circle',
          symbolSize: 14,
          itemStyle: { color: primary, borderColor: '#ffffff', borderWidth: 2 },
          data: [{ xAxis: toPct(value), yAxis: '' }],
        },
        markLine:
          target != null
            ? {
                symbol: 'none',
                label: { show: true, formatter: 'Target', position: 'end' },
                lineStyle: { color: ON_SURFACE, width: 2, type: 'solid' as const },
                data: [{ xAxis: toPct(target) }],
              }
            : undefined,
        z: 3,
      },
    ],
  };
}

/**
 * Pure ECharts option builder for gauge variants (Phase 1b set).
 * Call `ensureGaugeChart()` before rendering.
 */
export function buildGaugeChartOption(args: PixelChartGaugeOptionArgs): EChartsCoreOption {
  switch (args.variant) {
    case 'linear':
      return buildLinearGauge(args);
    case 'bullet':
      return buildBulletGauge(args);
    case 'radial':
    case 'semi':
    case 'donut':
    default:
      return buildArcGauge(args);
  }
}
