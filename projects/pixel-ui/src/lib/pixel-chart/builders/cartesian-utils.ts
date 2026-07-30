import type {
  PixelChartAxisLines,
  PixelChartGridLines,
  PixelChartNumberFormat,
  PixelChartPlotPadding,
  PixelChartSeries,
  PixelChartShowValues,
} from '../pixel-chart.types';

export type PixelChartCartesianGridBase = {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
};

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
  options?: {
    readonly suffix?: string;
    readonly format?: PixelChartNumberFormat | null;
    readonly locale?: string;
    readonly nullLabel?: string;
  },
): string {
  if (value == null || value === '') {
    return options?.nullLabel ?? '—';
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return String(value);
  }

  const format = options?.format;
  if (format) {
    const locale = format.locale ?? options?.locale;
    const style = format.style ?? 'decimal';
    try {
      if (style === 'compact') {
        const formatted = new Intl.NumberFormat(locale, {
          notation: 'compact',
          maximumFractionDigits: format.maximumFractionDigits ?? 1,
          minimumFractionDigits: format.minimumFractionDigits,
        }).format(n);
        const suffix = format.suffix ?? options?.suffix ?? '';
        return `${formatted}${suffix}`;
      }
      if (style === 'currency') {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: format.currency ?? 'USD',
          minimumFractionDigits: format.minimumFractionDigits,
          maximumFractionDigits: format.maximumFractionDigits,
        }).format(n);
      }
      if (style === 'percent' || percent) {
        // Values are already 0–100 in percent chart mode; Intl percent expects 0–1.
        const ratio = percent ? n / 100 : n;
        return new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: format.minimumFractionDigits ?? (percent ? 0 : 1),
          maximumFractionDigits: format.maximumFractionDigits ?? (percent ? 0 : 1),
        }).format(ratio);
      }
      const formatted = new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: format.minimumFractionDigits,
        maximumFractionDigits: format.maximumFractionDigits,
      }).format(n);
      const suffix = format.suffix ?? options?.suffix ?? '';
      return `${formatted}${suffix}`;
    } catch {
      // Fall through to simple formatting when Intl options are invalid.
    }
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

/** Default cartesian plot margins (titles get a little extra room). */
export function defaultCartesianGrid(args: {
  readonly xAxisName?: string;
  readonly yAxisName?: string;
  readonly horizontal?: boolean;
}): PixelChartCartesianGridBase {
  const xAxisName = args.xAxisName?.trim() ?? '';
  const yAxisName = args.yAxisName?.trim() ?? '';
  const horizontal = args.horizontal === true;
  return {
    left: horizontal ? (yAxisName ? 88 : 72) : yAxisName ? 64 : 48,
    right: 32,
    top: 32,
    bottom: xAxisName ? 56 : 40,
  };
}

/** Merge optional `plotPadding` over builder defaults. */
export function resolveCartesianGrid(
  base: PixelChartCartesianGridBase,
  plotPadding?: PixelChartPlotPadding | null,
): PixelChartCartesianGridBase {
  if (!plotPadding) {
    return base;
  }
  return {
    left: plotPadding.left ?? base.left,
    right: plotPadding.right ?? base.right,
    top: plotPadding.top ?? base.top,
    bottom: plotPadding.bottom ?? base.bottom,
  };
}

/** Whether splitLine should show for a cartesian axis role + plot axis. */
export function resolveAxisSplitLineShow(
  gridLines: PixelChartGridLines | undefined,
  role: 'category' | 'value',
  axis: 'x' | 'y',
): boolean {
  const mode = gridLines ?? 'on';
  if (mode === 'off') {
    return false;
  }
  if (mode === 'x' || mode === 'y') {
    return mode === axis;
  }
  // `on` — value axis only (standard dashboard grid).
  return role === 'value';
}

/** Whether the X or Y axis baseline should render. */
export function resolveAxisLineShow(
  axisLines: PixelChartAxisLines | undefined,
  axis: 'x' | 'y',
): boolean {
  const mode = axisLines ?? 'on';
  if (mode === 'off') {
    return false;
  }
  if (mode === 'on') {
    return true;
  }
  return mode === axis;
}

export function axisLineFields(
  axisLines: PixelChartAxisLines | undefined,
  axis: 'x' | 'y',
): { axisLine: { show: boolean } } {
  return { axisLine: { show: resolveAxisLineShow(axisLines, axis) } };
}

export function splitLineFields(
  gridLines: PixelChartGridLines | undefined,
  role: 'category' | 'value',
  axis: 'x' | 'y',
): { splitLine: { show: boolean } } {
  return {
    splitLine: { show: resolveAxisSplitLineShow(gridLines, role, axis) },
  };
}
