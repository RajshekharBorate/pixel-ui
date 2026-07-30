import type { EChartsCoreOption } from 'echarts/core';
import { resolvePixelChartPaletteColors } from '../pixel-chart-theme';
import type { PixelChartPalette } from '../pixel-chart.types';

export type PixelChartGaugeVariant =
  | 'radial'
  | 'semi'
  | 'linear'
  | 'donut'
  | 'bullet'
  | 'solid'
  | 'multi-range'
  | 'dual'
  | 'tick'
  | 'vertical';

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
const TAPERED_NEEDLE_ICON = 'path://M0 -100 L5 -2 L0 10 L-5 -2 Z';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function defaultRanges(min: number, max: number): PixelChartGaugeRange[] {
  const span = max - min || 1;
  return [
    { from: min, to: min + span * 0.5, color: SEMANTIC_ERROR },
    { from: min + span * 0.5, to: min + span * 0.75, color: SEMANTIC_WARNING },
    { from: min + span * 0.75, to: max, color: SEMANTIC_SUCCESS },
  ];
}

/** ECharts axisLine color stops: `[ratio, color]` where ratio is 0–1 of max. */
function rangesToAxisColors(
  ranges: readonly PixelChartGaugeRange[],
  min: number,
  max: number,
): [number, string][] {
  const span = max - min || 1;
  const colors = [SEMANTIC_ERROR, SEMANTIC_WARNING, SEMANTIC_SUCCESS];
  return ranges.map((r, i) => [
    clamp((r.to - min) / span, 0, 1),
    r.color ?? colors[i % colors.length]!,
  ]);
}

function outerScaleAxisLabel(distance = -18): Record<string, unknown> {
  return {
    show: true,
    distance,
    fontSize: 11,
    formatter: (value: number) => String(Math.round(value * 100) / 100),
  };
}

function radialScaleMarks(): {
  axisTick: Record<string, unknown>;
  splitLine: Record<string, unknown>;
} {
  return {
    axisTick: {
      show: true,
      splitNumber: 5,
      distance: 0,
      length: 5,
      lineStyle: { width: 1 },
    },
    splitLine: {
      show: true,
      distance: 0,
      length: 9,
      lineStyle: { width: 1.5 },
    },
  };
}

function endpointValueAxis(min: number, max: number): Record<string, unknown> {
  return {
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: {
      show: true,
      formatter: (value: number) => {
        if (value === 0) {
          return String(min);
        }
        if (value === 100) {
          return String(max);
        }
        return '';
      },
    },
  };
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
        splitNumber: 2,
        startAngle,
        endAngle,
        radius: isDonut ? '85%' : '82%',
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
        ...(variant === 'radial'
          ? radialScaleMarks()
          : {
              axisTick: { show: false },
              splitLine: { show: false, distance: 0, length: 0 },
            }),
        axisLabel:
          isDonut
            ? { show: false }
            : outerScaleAxisLabel(variant === 'radial' ? -27 : -18),
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
          formatter: (v: number) =>
            isDonut ? `${Math.round(v)}\n${min} — ${max}` : `${Math.round(v)}`,
          offsetCenter: [0, isDonut ? '-6%' : '0%'],
          fontSize: isDonut ? 24 : 28,
          lineHeight: isDonut ? 26 : undefined,
          fontWeight: 600,
        },
        data: [{ value, name: args.label ?? '' }],
      },
    ],
  };
}

/** Phase 2 — thick minimal arc (no ticks / labels on the ring). */
function buildSolidGauge(args: PixelChartGaugeOptionArgs): EChartsCoreOption {
  const min = args.min ?? 0;
  const max = args.max ?? 100;
  const value = clamp(args.value, min, max);
  const colors = resolvePixelChartPaletteColors(args.palette ?? 'brand');
  const primary = colors[0] ?? '#1565c0';
  const thick = 32;

  return {
    series: [
      {
        type: 'gauge',
        min,
        max,
        splitNumber: 2,
        startAngle: 210,
        endAngle: -30,
        radius: '82%',
        center: ['50%', '58%'],
        progress: {
          show: true,
          width: thick,
          roundCap: true,
          itemStyle: { color: primary },
        },
        axisLine: {
          roundCap: true,
          lineStyle: { width: thick, color: [[1, TRACK_MUTED]] },
        },
        axisTick: { show: false },
        splitLine: { show: false, distance: 0, length: 0 },
        axisLabel: outerScaleAxisLabel(),
        pointer: { show: false },
        anchor: { show: false },
        title: {
          show: !!args.label,
          offsetCenter: [0, '32%'],
          fontSize: 13,
        },
        detail: {
          show: args.showValue !== false,
          valueAnimation: true,
          formatter: (v: number) => `${Math.round(v)}`,
          offsetCenter: [0, '4%'],
          fontSize: 32,
          fontWeight: 600,
        },
        data: [{ value, name: args.label ?? '' }],
      },
    ],
  };
}

/** Phase 2 — qualitative zones on the track + needle. */
function buildMultiRangeGauge(args: PixelChartGaugeOptionArgs): EChartsCoreOption {
  const min = args.min ?? 0;
  const max = args.max ?? 100;
  const value = clamp(args.value, min, max);
  const colors = resolvePixelChartPaletteColors(args.palette ?? 'brand');
  const primary = colors[0] ?? '#1565c0';
  const ranges =
    args.ranges && args.ranges.length > 0 ? args.ranges : defaultRanges(min, max);
  const axisColors = rangesToAxisColors(ranges, min, max);

  return {
    series: [
      {
        type: 'gauge',
        min,
        max,
        splitNumber: 4,
        startAngle: 210,
        endAngle: -30,
        radius: '82%',
        center: ['50%', '55%'],
        progress: { show: false },
        axisLine: {
          lineStyle: { width: 18, color: axisColors },
        },
        axisTick: { show: false },
        splitLine: {
          show: true,
          distance: 0,
          length: 8,
          lineStyle: { width: 1.5 },
        },
        axisLabel: outerScaleAxisLabel(-26),
        pointer: {
          show: true,
          icon: TAPERED_NEEDLE_ICON,
          length: '58%',
          width: 10,
          offsetCenter: [0, '-2%'],
          itemStyle: { color: primary },
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 12,
          itemStyle: { color: primary },
        },
        title: {
          show: !!args.label,
          offsetCenter: [0, '58%'],
          fontSize: 13,
        },
        detail: {
          show: args.showValue !== false,
          valueAnimation: true,
          formatter: (v: number) => `${Math.round(v)}`,
          offsetCenter: [0, '38%'],
          fontSize: 26,
          fontWeight: 600,
        },
        data: [{ value, name: args.label ?? '' }],
      },
    ],
  };
}

/** Phase 2 — actual vs target as two concentric arcs. */
function buildDualGauge(args: PixelChartGaugeOptionArgs): EChartsCoreOption {
  const min = args.min ?? 0;
  const max = args.max ?? 100;
  const value = clamp(args.value, min, max);
  const target = args.target != null ? clamp(args.target, min, max) : null;
  const colors = resolvePixelChartPaletteColors(args.palette ?? 'brand');
  const primary = colors[0] ?? '#1565c0';
  const secondary = colors[1] ?? '#00897b';

  const series: Record<string, unknown>[] = [
    {
      type: 'gauge',
      min,
      max,
      splitNumber: 2,
      startAngle: 210,
      endAngle: -30,
      radius: '84%',
      center: ['50%', '55%'],
      progress: {
        show: true,
        width: 12,
        itemStyle: { color: primary },
      },
      axisLine: {
        lineStyle: { width: 12, color: [[1, TRACK_MUTED]] },
      },
      axisTick: { show: false },
      splitLine: { show: false, distance: 0, length: 0 },
      axisLabel: outerScaleAxisLabel(),
      pointer: { show: false },
      anchor: { show: false },
      title: {
        show: !!args.label,
        offsetCenter: [0, '30%'],
        fontSize: 13,
      },
      detail: {
        show: args.showValue !== false,
        valueAnimation: true,
        formatter: (v: number) => `${Math.round(v)}`,
        offsetCenter: [0, '2%'],
        fontSize: 26,
        fontWeight: 600,
      },
      data: [{ value, name: args.label ?? '' }],
      z: 2,
    },
  ];

  if (target != null) {
    series.unshift({
      type: 'gauge',
      min,
      max,
      startAngle: 210,
      endAngle: -30,
      radius: '70%',
      center: ['50%', '55%'],
      progress: {
        show: true,
        width: 8,
        itemStyle: { color: secondary },
      },
      axisLine: {
        lineStyle: { width: 8, color: [[1, TRACK_MUTED]] },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      anchor: { show: false },
      title: { show: false },
      detail: { show: false },
      data: [{ value: target, name: 'Target' }],
      z: 1,
    });
  }

  return { series };
}

/** Phase 2 — dense ticks + needle. */
function buildTickGauge(args: PixelChartGaugeOptionArgs): EChartsCoreOption {
  const min = args.min ?? 0;
  const max = args.max ?? 100;
  const value = clamp(args.value, min, max);
  const colors = resolvePixelChartPaletteColors(args.palette ?? 'brand');
  const primary = colors[0] ?? '#1565c0';

  return {
    series: [
      {
        type: 'gauge',
        min,
        max,
        splitNumber: 10,
        startAngle: 210,
        endAngle: -30,
        radius: '80%',
        center: ['50%', '55%'],
        progress: { show: false },
        axisLine: {
          lineStyle: { width: 6, color: [[1, TRACK_MUTED]] },
        },
        axisTick: {
          show: true,
          splitNumber: 5,
          length: 8,
          distance: 0,
          lineStyle: { width: 1 },
        },
        splitLine: {
          show: true,
          length: 14,
          distance: 0,
          lineStyle: { width: 2 },
        },
        axisLabel: {
          show: true,
          distance: -32,
          fontSize: 11,
        },
        pointer: {
          show: true,
          icon: TAPERED_NEEDLE_ICON,
          length: '62%',
          width: 8,
          offsetCenter: [0, '-2%'],
          itemStyle: { color: primary },
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 11,
          itemStyle: { color: primary },
        },
        title: {
          show: !!args.label,
          offsetCenter: [0, '58%'],
          fontSize: 13,
        },
        detail: {
          show: args.showValue !== false,
          valueAnimation: true,
          formatter: (v: number) => `${Math.round(v)}`,
          offsetCenter: [0, '38%'],
          fontSize: 24,
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
    grid: { left: 16, right: 16, top: 40, bottom: 40 },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      show: true,
      ...endpointValueAxis(min, max),
    },
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

/** Phase 2 — vertical bar gauge. */
function buildVerticalGauge(args: PixelChartGaugeOptionArgs): EChartsCoreOption {
  const min = args.min ?? 0;
  const max = args.max ?? 100;
  const value = clamp(args.value, min, max);
  const colors = resolvePixelChartPaletteColors(args.palette ?? 'brand');
  const primary = colors[0] ?? '#1565c0';
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return {
    grid: { left: 48, right: 24, top: 24, bottom: 36 },
    xAxis: {
      type: 'category',
      data: [args.label || ''],
      show: !!args.label,
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      show: true,
      ...endpointValueAxis(min, max),
    },
    series: [
      {
        type: 'bar',
        data: [100],
        barWidth: 28,
        itemStyle: { color: TRACK_MUTED, borderRadius: [14, 14, 14, 14] },
        silent: true,
        z: 1,
      },
      {
        type: 'bar',
        data: [pct],
        barWidth: 28,
        barGap: '-100%',
        itemStyle: { color: primary, borderRadius: [14, 14, 14, 14] },
        label: {
          show: args.showValue !== false,
          position: 'top',
          formatter: () => `${Math.round(value)}`,
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
    args.ranges && args.ranges.length > 0 ? args.ranges : defaultRanges(min, max);

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
    grid: { left: 16, right: 24, top: 36, bottom: 40 },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      show: true,
      ...endpointValueAxis(min, max),
    },
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
          label: {
            show: args.showValue !== false,
            formatter: () => String(Math.round(value)),
            position: 'top',
            distance: 8,
          },
          data: [{ xAxis: toPct(value), yAxis: '' }],
        },
        markLine:
          target != null
            ? {
                symbol: 'none',
                label: { show: true, formatter: 'Target', position: 'end' },
                // Color comes from host theme merge (on-surface) for dark/light.
                lineStyle: { width: 2, type: 'solid' as const },
                data: [{ xAxis: toPct(target) }],
              }
            : undefined,
        z: 3,
      },
    ],
  };
}

/**
 * Pure ECharts option builder for gauge variants (Phase 1b + Phase 2).
 * Call `ensureGaugeChart()` before rendering.
 */
export function buildGaugeChartOption(args: PixelChartGaugeOptionArgs): EChartsCoreOption {
  switch (args.variant) {
    case 'linear':
      return buildLinearGauge(args);
    case 'vertical':
      return buildVerticalGauge(args);
    case 'bullet':
      return buildBulletGauge(args);
    case 'solid':
      return buildSolidGauge(args);
    case 'multi-range':
      return buildMultiRangeGauge(args);
    case 'dual':
      return buildDualGauge(args);
    case 'tick':
      return buildTickGauge(args);
    case 'radial':
    case 'semi':
    case 'donut':
    default:
      return buildArcGauge(args);
  }
}
