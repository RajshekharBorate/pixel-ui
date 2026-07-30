import type { EChartsCoreOption } from 'echarts/core';

/** Named hatch patterns for high-contrast / color-blind friendly fills. */
export type PixelChartPatternId = 'dots' | 'lines' | 'cross' | 'none';

const DECALS: Record<Exclude<PixelChartPatternId, 'none'>, Record<string, unknown>> = {
  dots: {
    symbol: 'circle',
    symbolSize: 3,
    dashArrayX: [1, 0],
    dashArrayY: [2, 4],
    rotation: 0,
  },
  lines: {
    symbol: 'rect',
    dashArrayX: [1, 0],
    dashArrayY: [4, 3],
    rotation: Math.PI / 4,
  },
  cross: {
    symbol: 'rect',
    dashArrayX: [1, 0],
    dashArrayY: [2, 5],
    rotation: Math.PI / 6,
    maxTileWidth: 8,
    maxTileHeight: 8,
  },
};

const PATTERN_CYCLE: readonly Exclude<PixelChartPatternId, 'none'>[] = [
  'dots',
  'lines',
  'cross',
];

export function resolvePixelChartDecal(
  pattern: PixelChartPatternId,
): Record<string, unknown> | undefined {
  if (pattern === 'none') {
    return undefined;
  }
  return { ...DECALS[pattern] };
}

/**
 * Apply rotating hatch decals to series `itemStyle` (ECharts canvas).
 * No-op when `enabled` is false.
 */
export function withPatternFills(
  option: EChartsCoreOption,
  enabled: boolean,
): EChartsCoreOption {
  if (!enabled) {
    return option;
  }
  const raw = option as Record<string, unknown>;
  const series = raw['series'];
  if (!Array.isArray(series)) {
    return option;
  }
  return {
    ...raw,
    series: series.map((s, index) => {
      if (!s || typeof s !== 'object') {
        return s;
      }
      const seriesObj = s as Record<string, unknown>;
      if (seriesObj['id'] === '__stack-total') {
        return seriesObj;
      }
      const pattern = PATTERN_CYCLE[index % PATTERN_CYCLE.length]!;
      const decal = resolvePixelChartDecal(pattern);
      const itemStyle = {
        ...((seriesObj['itemStyle'] as object) ?? {}),
        decal,
      };
      return { ...seriesObj, itemStyle };
    }),
  } as EChartsCoreOption;
}
