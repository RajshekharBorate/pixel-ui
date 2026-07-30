import type {
  PixelChartAxisPointer,
  PixelChartNumberFormat,
  PixelChartReferenceBand,
  PixelChartReferenceLine,
} from '../pixel-chart.types';
import { formatChartValue } from './cartesian-utils';

/** Build ECharts markLine from reference lines. */
export function buildReferenceMarkLine(
  lines: readonly PixelChartReferenceLine[] | null | undefined,
  options?: {
    readonly format?: PixelChartNumberFormat | null;
    readonly locale?: string;
    readonly valueSuffix?: string;
  },
): Record<string, unknown> | undefined {
  if (!lines || lines.length === 0) {
    return undefined;
  }
  return {
    symbol: 'none',
    label: { show: true, position: 'insideEndTop' },
    data: lines.map((line) => {
      const axis = line.axis === 'x' ? 'xAxis' : 'yAxis';
      return {
        name: line.id,
        [axis]: line.value,
        label: {
          formatter: () =>
            line.label?.trim() ||
            formatChartValue(line.value, false, {
              format: options?.format,
              locale: options?.locale,
              suffix: options?.valueSuffix,
            }),
        },
        lineStyle: {
          type: line.lineStyle ?? 'dashed',
          width: 1.5,
          color: line.color,
        },
      };
    }),
  };
}

/** Build ECharts markArea from reference bands. */
export function buildReferenceMarkArea(
  bands: readonly PixelChartReferenceBand[] | null | undefined,
): Record<string, unknown> | undefined {
  if (!bands || bands.length === 0) {
    return undefined;
  }
  return {
    silent: true,
    data: bands.map((band) => {
      const axis = band.axis === 'x' ? 'xAxis' : 'yAxis';
      const start = { [axis]: Math.min(band.from, band.to) };
      const end: Record<string, unknown> = {
        [axis]: Math.max(band.from, band.to),
      };
      if (band.label?.trim()) {
        end['itemStyle'] = undefined;
      }
      return [
        {
          ...start,
          itemStyle: {
            color: band.color ?? 'rgba(21, 101, 192, 0.12)',
          },
          name: band.label?.trim() || band.id,
        },
        end,
      ];
    }),
  };
}

/** Attach markLine / markArea onto the first drawable series (skip helpers). */
export function withSeriesReferences(
  series: Record<string, unknown>[],
  args: {
    readonly referenceLines?: readonly PixelChartReferenceLine[] | null;
    readonly referenceBands?: readonly PixelChartReferenceBand[] | null;
    readonly format?: PixelChartNumberFormat | null;
    readonly locale?: string;
    readonly valueSuffix?: string;
    readonly skipSeriesIds?: ReadonlySet<string>;
  },
): Record<string, unknown>[] {
  const markLine = buildReferenceMarkLine(args.referenceLines, args);
  const markArea = buildReferenceMarkArea(args.referenceBands);
  if (!markLine && !markArea) {
    return series;
  }
  const skip = args.skipSeriesIds ?? new Set<string>();
  let attached = false;
  return series.map((item) => {
    const id = item['id'] != null ? String(item['id']) : '';
    if (attached || skip.has(id) || id.startsWith('__')) {
      return item;
    }
    attached = true;
    return {
      ...item,
      ...(markLine ? { markLine } : {}),
      ...(markArea ? { markArea } : {}),
    };
  });
}

export function axisPointerFields(
  axisPointer: PixelChartAxisPointer | undefined,
  fallback: PixelChartAxisPointer = 'line',
): { axisPointer?: { type: string } } | Record<string, never> {
  const mode = axisPointer ?? fallback;
  if (mode === 'none') {
    return { axisPointer: { type: 'none' } };
  }
  return { axisPointer: { type: mode } };
}

/** Value-axis tick label formatter fields. */
export function valueAxisLabelFields(args: {
  readonly percent?: boolean;
  readonly axisValueFormat?: PixelChartNumberFormat | null;
  readonly valueFormat?: PixelChartNumberFormat | null;
  readonly valueSuffix?: string;
  readonly locale?: string;
}): { axisLabel?: Record<string, unknown> } {
  const format = args.axisValueFormat ?? args.valueFormat ?? null;
  if (args.percent && !format) {
    return { axisLabel: { formatter: '{value}%' } };
  }
  if (!format && !args.valueSuffix) {
    return {};
  }
  return {
    axisLabel: {
      formatter: (value: number) =>
        formatChartValue(value, !!args.percent, {
          format,
          suffix: args.valueSuffix,
          locale: args.locale,
        }),
    },
  };
}
