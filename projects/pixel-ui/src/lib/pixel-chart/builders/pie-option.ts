import type { EChartsCoreOption } from 'echarts/core';
import { resolvePixelChartPaletteColors } from '../pixel-chart-theme';
import type { PixelChartPalette, PixelChartSeries, PixelChartShowValues } from '../pixel-chart.types';

export type PixelChartPieMode = 'pie' | 'donut' | 'semi';

export type PixelChartPieSlice = {
  readonly id: string;
  readonly name: string;
  readonly value: number;
  readonly color?: string;
};

export type PixelChartPieOptionArgs = {
  readonly slices: readonly PixelChartPieSlice[];
  readonly mode: PixelChartPieMode;
  readonly showValues: PixelChartShowValues;
  readonly showCenterLabel?: boolean;
  readonly centerLabel?: string;
  readonly hiddenSliceIds?: ReadonlySet<string>;
  readonly palette?: PixelChartPalette;
};

function resolveLabel(showValues: PixelChartShowValues, sliceCount: number): boolean {
  if (showValues === true) {
    return true;
  }
  if (showValues === false) {
    return false;
  }
  return sliceCount <= 8;
}

/**
 * Pure ECharts option builder for pie / donut / semi-donut.
 * Call `ensurePieChart()` before rendering.
 */
export function buildPieChartOption(args: PixelChartPieOptionArgs): EChartsCoreOption {
  const {
    slices,
    mode,
    showValues,
    showCenterLabel = mode !== 'pie',
    centerLabel,
    hiddenSliceIds,
    palette = 'brand',
  } = args;

  const colors = resolvePixelChartPaletteColors(palette);
  const visible = slices.filter((s) => !hiddenSliceIds?.has(s.id) && s.value > 0);
  const total = visible.reduce((sum, s) => sum + (Number.isFinite(s.value) ? s.value : 0), 0);
  const showLabel = resolveLabel(showValues, visible.length);

  const isSemi = mode === 'semi';
  const isDonut = mode === 'donut' || isSemi;
  const radius = isDonut ? (isSemi ? ['45%', '75%'] : ['48%', '72%']) : ['0%', '72%'];
  const center = isSemi ? ['50%', '62%'] : ['50%', '50%'];

  const data = visible.map((s, index) => ({
    id: s.id,
    name: s.name,
    value: s.value,
    itemStyle: {
      color: s.color ?? colors[index % colors.length],
    },
  }));

  const centerText =
    centerLabel?.trim() ||
    (total > 0 ? `Total\n${total.toLocaleString()}` : '');

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as { name?: string; value?: number; percent?: number };
        const pct = p.percent != null ? `${p.percent.toFixed(1)}%` : '';
        return `${p.name ?? ''}: ${p.value ?? '—'} (${pct})`;
      },
    },
    legend: { show: false },
    title:
      showCenterLabel && isDonut && centerText
        ? {
            text: centerText,
            left: 'center',
            top: isSemi ? '52%' : '42%',
            textStyle: {
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 20,
            },
          }
        : undefined,
    series: [
      {
        type: 'pie',
        id: 'pixel-pie',
        name: 'Share',
        radius,
        center,
        startAngle: isSemi ? 180 : 90,
        endAngle: isSemi ? 360 : undefined,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderWidth: 2,
          borderColor: 'transparent',
        },
        label: {
          show: showLabel,
          formatter: '{d}%',
        },
        labelLine: { show: showLabel },
        data,
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowOffsetY: 2 },
          label: {
            show: true,
            formatter: '{d}%',
          },
          labelLine: { show: true },
        },
      },
    ],
  };
}

/** Table rows for pie slices (Name / Value / %). */
export function buildPieTable(slices: readonly PixelChartPieSlice[]): {
  columns: { key: string; header: string }[];
  rows: Readonly<Record<string, string | number | null>>[];
} {
  const total = slices.reduce((s, x) => s + (x.value > 0 ? x.value : 0), 0);
  return {
    columns: [
      { key: 'name', header: 'Category' },
      { key: 'value', header: 'Value' },
      { key: 'percent', header: 'Percentage' },
    ],
    rows: [
      ...slices.map((s) => ({
        name: s.name,
        value: s.value,
        percent: total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : '—',
      })),
      {
        name: 'Total',
        value: total,
        percent: total > 0 ? '100%' : '—',
      },
    ],
  };
}

export function pieSlicesToLegendSeries(
  slices: readonly PixelChartPieSlice[],
): PixelChartSeries[] {
  return slices.map((s) => ({
    id: s.id,
    name: s.name,
    data: [s.value],
    color: s.color,
  }));
}
