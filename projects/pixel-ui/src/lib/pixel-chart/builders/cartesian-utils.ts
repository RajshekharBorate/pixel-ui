import type { PixelChartSeries, PixelChartShowValues } from '../pixel-chart.types';

/** Resolve series data aligned to category labels. */
export function seriesValuesForCategories(
  series: PixelChartSeries,
  categories: readonly string[],
): (number | null)[] {
  const categoryCount = categories.length;
  const raw = series.data;
  if (raw.length === 0) {
    return Array.from({ length: categoryCount }, () => null);
  }
  if (typeof raw[0] === 'number' || raw[0] === null) {
    const nums = raw as readonly (number | null)[];
    return Array.from({ length: categoryCount }, (_, i) =>
      i < nums.length ? nums[i]! : null,
    );
  }
  const byX = new Map<string, number | null>();
  for (const point of raw as readonly { x: string | number | Date; y: number | null }[]) {
    byX.set(String(point.x), point.y);
  }
  return categories.map((cat, i) => byX.get(cat) ?? byX.get(String(i)) ?? null);
}

/** Column-wise normalize stacks to 0–100. */
export function toPercentStacks(
  matrix: readonly (readonly (number | null)[])[],
): (number | null)[][] {
  const cols = matrix[0]?.length ?? 0;
  const out = matrix.map((row) => row.map((v) => v));
  for (let c = 0; c < cols; c++) {
    let sum = 0;
    for (const row of matrix) {
      const v = row[c];
      if (v != null && Number.isFinite(v)) {
        sum += v;
      }
    }
    for (let r = 0; r < matrix.length; r++) {
      const v = matrix[r]![c];
      out[r]![c] = sum > 0 && v != null ? (v / sum) * 100 : v == null ? null : 0;
    }
  }
  return out;
}

export function resolveShowLabel(
  showValues: PixelChartShowValues,
  seriesCount: number,
  categoryCount: number,
  autoLabelMaxCells: number,
): boolean {
  if (showValues === true) {
    return true;
  }
  if (showValues === false) {
    return false;
  }
  return seriesCount * categoryCount <= autoLabelMaxCells;
}

export function formatChartValue(
  value: unknown,
  percent: boolean,
  options?: { readonly suffix?: string },
): string {
  if (value == null || value === '') {
    return '—';
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return String(value);
  }
  if (percent) {
    return `${n.toFixed(1)}%`;
  }
  const suffix = options?.suffix ?? '';
  return `${n}${suffix}`;
}

/** ECharts axis `name` fields when a non-empty title is provided. */
export function axisNameFields(name: string | undefined): Record<string, unknown> {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    return {};
  }
  return {
    name: trimmed,
    nameLocation: 'middle' as const,
    nameGap: 28,
  };
}
