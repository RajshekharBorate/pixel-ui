import type { PixelChartSeries } from '../pixel-chart.types';

export type PixelChartTableColumn = {
  readonly key: string;
  readonly header: string;
};

export type PixelChartTableRow = Readonly<Record<string, string | number | null>>;

function cellAt(series: PixelChartSeries, index: number, category: string): number | null {
  const raw = series.data;
  if (raw.length === 0) {
    return null;
  }
  if (typeof raw[0] === 'number' || raw[0] === null) {
    const nums = raw as readonly (number | null)[];
    return index < nums.length ? nums[index]! : null;
  }
  const points = raw as readonly { x: string | number | Date; y: number | null }[];
  const hit = points.find((p) => String(p.x) === category || String(p.x) === String(index));
  return hit?.y ?? null;
}

/** Flatten series × categories into a table for a11y / export. */
export function buildChartTable(args: {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly string[];
}): { columns: PixelChartTableColumn[]; rows: PixelChartTableRow[] } {
  const { series, categories } = args;
  const columns: PixelChartTableColumn[] = [
    { key: 'category', header: 'Category' },
    ...series.map((s) => ({ key: s.id, header: s.name })),
  ];
  const rows: PixelChartTableRow[] = categories.map((category, index) => {
    const row: Record<string, string | number | null> = { category };
    for (const s of series) {
      row[s.id] = cellAt(s, index, category);
    }
    return row;
  });
  return { columns, rows };
}
