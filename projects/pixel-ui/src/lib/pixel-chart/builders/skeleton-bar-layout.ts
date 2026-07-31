import type {
  PixelSkeletonBarCategoryLayout,
  PixelSkeletonBarLayout,
} from '../../pixel-loader/pixel-loader.types';
import type { PixelChartSeries } from '../pixel-chart.types';
import { seriesValuesForCategories, toPercentStacks } from './cartesian-utils';
import type { PixelChartBarMode } from './bar-option';
import { normalizeCategoryLabels, type PixelChartAxisValue } from './time-axis';

export type { PixelSkeletonBarCategoryLayout, PixelSkeletonBarLayout };

/**
 * Build skeleton bar sizes from the same series / categories the chart renders.
 * Returns `null` when there is no drawable data (skeleton falls back to decorative stubs).
 */
export function buildSkeletonBarLayout(args: {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly PixelChartAxisValue[];
  readonly mode: PixelChartBarMode;
  readonly hiddenSeriesIds?: ReadonlySet<string> | readonly string[];
  readonly barMaxWidth?: number;
}): PixelSkeletonBarLayout | null {
  const categories = normalizeCategoryLabels(args.categories);
  const hidden =
    args.hiddenSeriesIds instanceof Set
      ? args.hiddenSeriesIds
      : new Set(args.hiddenSeriesIds ?? []);
  const visible = args.series.filter((s) => !hidden.has(s.id));
  if (visible.length === 0 || categories.length === 0) {
    return null;
  }

  const matrix = visible.map((s) => seriesValuesForCategories(s, categories));
  const mode = args.mode;
  const layoutCategories: PixelSkeletonBarCategoryLayout[] = [];

  if (mode === 'percent') {
    const pct = toPercentStacks(matrix);
    for (let c = 0; c < categories.length; c++) {
      const sizes = pct.map((row) => Math.max(0, row[c] ?? 0));
      const extentPercent = sizes.some((s) => s > 0) ? 100 : 12;
      layoutCategories.push({ sizes, extentPercent });
    }
  } else if (mode === 'stacked') {
    const sums = categories.map((_, c) =>
      matrix.reduce((total, row) => {
        const v = row[c];
        return v != null && Number.isFinite(v) ? total + v : total;
      }, 0),
    );
    const maxSum = Math.max(0, ...sums);
    for (let c = 0; c < categories.length; c++) {
      const sizes = matrix.map((row) => Math.max(0, row[c] ?? 0));
      const extentPercent =
        maxSum > 0 ? (sums[c]! / maxSum) * 100 : sizes.some((s) => s > 0) ? 12 : 0;
      layoutCategories.push({ sizes, extentPercent: Math.max(extentPercent, 0) });
    }
  } else {
    let max = 0;
    for (const row of matrix) {
      for (const v of row) {
        if (v != null && Number.isFinite(v) && v > max) {
          max = v;
        }
      }
    }
    for (let c = 0; c < categories.length; c++) {
      const sizes = matrix.map((row) => {
        const v = row[c];
        if (v == null || !Number.isFinite(v) || max <= 0) {
          return 0;
        }
        return (v / max) * 100;
      });
      layoutCategories.push({ sizes });
    }
  }

  return {
    categories: layoutCategories,
    barMaxWidthPx: Math.max(4, args.barMaxWidth ?? 48),
  };
}
