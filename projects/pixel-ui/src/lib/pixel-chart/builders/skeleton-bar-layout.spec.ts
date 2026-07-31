import { describe, expect, it } from 'vitest';
import { buildSkeletonBarLayout } from './skeleton-bar-layout';

describe('buildSkeletonBarLayout', () => {
  const series = [
    { id: 'a', name: 'A', data: [10, 20, 40] },
    { id: 'b', name: 'B', data: [5, 10, 20] },
  ];
  const categories = ['Q1', 'Q2', 'Q3'];

  it('returns null when there is no drawable series or categories', () => {
    expect(
      buildSkeletonBarLayout({ series: [], categories, mode: 'grouped' }),
    ).toBeNull();
    expect(
      buildSkeletonBarLayout({ series, categories: [], mode: 'grouped' }),
    ).toBeNull();
    expect(
      buildSkeletonBarLayout({
        series,
        categories,
        mode: 'grouped',
        hiddenSeriesIds: ['a', 'b'],
      }),
    ).toBeNull();
  });

  it('normalizes single/grouped heights to the max value (0–100%)', () => {
    const layout = buildSkeletonBarLayout({
      series,
      categories,
      mode: 'grouped',
      barMaxWidth: 32,
    });
    expect(layout).not.toBeNull();
    expect(layout!.barMaxWidthPx).toBe(32);
    expect(layout!.categories).toHaveLength(3);
    // max value is 40 → Q3 series A is 100%, B is 50%
    expect(layout!.categories[2]!.sizes).toEqual([100, 50]);
    expect(layout!.categories[0]!.sizes[0]).toBeCloseTo(25);
  });

  it('respects hiddenSeriesIds', () => {
    const layout = buildSkeletonBarLayout({
      series,
      categories,
      mode: 'single',
      hiddenSeriesIds: ['b'],
    });
    expect(layout!.categories[2]!.sizes).toEqual([100]);
  });

  it('builds stacked extents relative to the tallest stack', () => {
    const layout = buildSkeletonBarLayout({
      series,
      categories,
      mode: 'stacked',
    });
    // Q3 sum 60 is tallest → 100%; Q1 sum 15 → 25%
    expect(layout!.categories[2]!.extentPercent).toBe(100);
    expect(layout!.categories[0]!.extentPercent).toBe(25);
    expect(layout!.categories[0]!.sizes).toEqual([10, 5]);
  });

  it('builds percent stacks that always fill 100% when any value is present', () => {
    const layout = buildSkeletonBarLayout({
      series,
      categories,
      mode: 'percent',
    });
    const q1 = layout!.categories[0]!;
    expect(q1.extentPercent).toBe(100);
    expect(q1.sizes[0]! + q1.sizes[1]!).toBeCloseTo(100);
  });
});
