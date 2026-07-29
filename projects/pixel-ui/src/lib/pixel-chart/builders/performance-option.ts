import type { EChartsCoreOption } from 'echarts/core';

/**
 * Performance presets for large series.
 *
 * - `auto` — progressive + LTTB sampling when point count crosses thresholds
 * - `off` — no progressive / sampling (small charts, exact points)
 * - `progressive` — ECharts progressive rendering only
 * - `sampled` — progressive + `sampling: 'lttb'` (line/area)
 */
export type PixelChartPerformanceMode = 'auto' | 'off' | 'progressive' | 'sampled';

/** Recommended max points per family (canvas, labels off / zoom on). Document in README. */
export const PIXEL_CHART_MAX_POINTS = {
  line: 10_000,
  area: 10_000,
  bar: 5_000,
  scatter: 20_000,
  bubble: 2_000,
  pie: 50,
  radar: 20,
  gauge: 1,
} as const;

/** Enable progressive rendering at / above this many points (auto). */
export const PIXEL_CHART_PROGRESSIVE_THRESHOLD = 2_000;

/** Enable LTTB sampling at / above this many points (auto / sampled). */
export const PIXEL_CHART_SAMPLING_THRESHOLD = 5_000;

/** Chunk size for ECharts progressive drawing. */
export const PIXEL_CHART_PROGRESSIVE_CHUNK = 400;

export type PixelChartPerformancePreset = {
  readonly progressive: number;
  readonly progressiveThreshold: number;
  readonly large: boolean;
  readonly sampling?: 'lttb' | 'average' | 'max' | 'min' | 'sum';
};

/**
 * Resolve series-level performance flags from mode + total point count.
 */
export function resolveChartPerformance(
  mode: PixelChartPerformanceMode | undefined,
  pointCount: number,
  options?: { readonly allowSampling?: boolean },
): PixelChartPerformancePreset | null {
  const resolved = mode ?? 'auto';
  if (resolved === 'off') {
    return null;
  }

  const allowSampling = options?.allowSampling !== false;
  const useProgressive =
    resolved === 'progressive' ||
    resolved === 'sampled' ||
    (resolved === 'auto' && pointCount >= PIXEL_CHART_PROGRESSIVE_THRESHOLD);
  const useSampling =
    allowSampling &&
    (resolved === 'sampled' ||
      (resolved === 'auto' && pointCount >= PIXEL_CHART_SAMPLING_THRESHOLD));

  if (!useProgressive && !useSampling) {
    return null;
  }

  return {
    progressive: PIXEL_CHART_PROGRESSIVE_CHUNK,
    progressiveThreshold: useProgressive ? 0 : Number.POSITIVE_INFINITY,
    large: useProgressive || useSampling,
    ...(useSampling ? { sampling: 'lttb' as const } : {}),
  };
}

/**
 * Merge performance flags onto each drawable series in an option.
 * Skips helper series (e.g. trendlines) when `skipSeriesIds` is set.
 */
export function withSeriesPerformance(
  option: EChartsCoreOption,
  preset: PixelChartPerformancePreset | null,
  skipSeriesIds?: ReadonlySet<string>,
): EChartsCoreOption {
  if (!preset) {
    return option;
  }
  const raw = option as Record<string, unknown>;
  const series = raw['series'];
  if (!Array.isArray(series)) {
    return option;
  }

  return {
    ...raw,
    animation: false,
    series: series.map((item) => {
      const s = item as Record<string, unknown>;
      const id = s['id'] != null ? String(s['id']) : '';
      if (skipSeriesIds?.has(id)) {
        return s;
      }
      return {
        ...s,
        progressive: preset.progressive,
        progressiveThreshold: preset.progressiveThreshold,
        large: preset.large,
        // Area charts are `type: 'line'` + `areaStyle`; sampling applies to line series only.
        ...(preset.sampling && s['type'] === 'line' ? { sampling: preset.sampling } : {}),
      };
    }),
  } as EChartsCoreOption;
}

/** Total numeric / categorical points across cartesian series aligned to categories. */
export function countCartesianPoints(
  seriesCount: number,
  categoryCount: number,
): number {
  return seriesCount * Math.max(0, categoryCount);
}
