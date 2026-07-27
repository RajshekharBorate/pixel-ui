/**
 * Linear regression + Pearson r / R² for scatter stats.
 * Points with non-finite x/y are skipped.
 */

export type PixelChartRegressionStats = {
  readonly n: number;
  readonly r: number;
  readonly r2: number;
  readonly slope: number;
  readonly intercept: number;
  /** Two endpoints for a trendline segment [x, y]. */
  readonly trendline: readonly [readonly [number, number], readonly [number, number]];
};

/** Soft cap for full-precision stats; larger sets are subsampled. Documented in README. */
export const PIXEL_CHART_STATS_MAX_N = 5000;

function subsample(
  xs: number[],
  ys: number[],
  maxN: number,
): { xs: number[]; ys: number[] } {
  if (xs.length <= maxN) {
    return { xs, ys };
  }
  const step = xs.length / maxN;
  const ox: number[] = [];
  const oy: number[] = [];
  for (let i = 0; i < maxN; i++) {
    const idx = Math.min(xs.length - 1, Math.floor(i * step));
    ox.push(xs[idx]!);
    oy.push(ys[idx]!);
  }
  return { xs: ox, ys: oy };
}

/**
 * Compute Pearson correlation, R², and OLS trendline for paired numeric points.
 */
export function computeScatterStats(
  points: readonly { readonly x: number; readonly y: number }[],
  maxN = PIXEL_CHART_STATS_MAX_N,
): PixelChartRegressionStats | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const p of points) {
    if (Number.isFinite(p.x) && Number.isFinite(p.y)) {
      xs.push(p.x);
      ys.push(p.y);
    }
  }
  if (xs.length < 2) {
    return null;
  }

  const sample = subsample(xs, ys, maxN);
  const n = sample.xs.length;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;
  for (let i = 0; i < n; i++) {
    const x = sample.xs[i]!;
    const y = sample.ys[i]!;
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumYY += y * y;
    sumXY += x * y;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;
  const ssxx = sumXX - n * meanX * meanX;
  const ssyy = sumYY - n * meanY * meanY;
  const ssxy = sumXY - n * meanX * meanY;

  if (ssxx === 0 || ssyy === 0) {
    return null;
  }

  const r = ssxy / Math.sqrt(ssxx * ssyy);
  const slope = ssxy / ssxx;
  const intercept = meanY - slope * meanX;
  const r2 = r * r;

  let minX = sample.xs[0]!;
  let maxX = sample.xs[0]!;
  for (const x of sample.xs) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }

  return {
    n: xs.length,
    r,
    r2,
    slope,
    intercept,
    trendline: [
      [minX, slope * minX + intercept],
      [maxX, slope * maxX + intercept],
    ],
  };
}
