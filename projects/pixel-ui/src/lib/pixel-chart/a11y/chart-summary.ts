import type { PixelChartSeries } from '../pixel-chart.types';

/** Build a short screen-reader summary for cartesian charts. */
export function buildChartSummary(args: {
  readonly title?: string;
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly string[];
}): string {
  const { title, series, categories } = args;
  const parts: string[] = [];
  if (title?.trim()) {
    parts.push(title.trim());
  }
  parts.push(
    `${series.length} series`,
    `${categories.length} categories`,
  );
  if (series.length > 0) {
    parts.push(`Series: ${series.map((s) => s.name).join(', ')}`);
  }
  return parts.join('. ') + '.';
}
