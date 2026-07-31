import { describe, expect, it } from 'vitest';
import {
  buildSkeletonPathLayout,
  buildSkeletonPieLayout,
  buildSkeletonRadarLayout,
  buildSkeletonScatterLayout,
} from './skeleton-chart-layouts';

describe('skeleton chart layouts', () => {
  it('builds line path proportions from series', () => {
    const layout = buildSkeletonPathLayout({
      series: [{ id: 'a', name: 'A', data: [10, 40, 20] }],
      categories: ['Q1', 'Q2', 'Q3'],
      filled: false,
      mode: 'step',
    });
    expect(layout).not.toBeNull();
    expect(layout!.filled).toBe(false);
    expect(layout!.mode).toBe('step');
    expect(layout!.series[0]!.points.map((p) => p.y)).toEqual([25, 100, 50]);
  });

  it('builds pie segment percents', () => {
    const layout = buildSkeletonPieLayout({
      slices: [
        { id: 'a', name: 'A', value: 25 },
        { id: 'b', name: 'B', value: 75 },
      ],
      mode: 'donut',
    });
    expect(layout!.segments).toEqual([25, 75]);
    expect(layout!.mode).toBe('donut');
  });

  it('builds scatter marker positions', () => {
    const layout = buildSkeletonScatterLayout({
      series: [
        {
          id: 'a',
          name: 'A',
          data: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
        },
      ],
    });
    expect(layout!.points).toHaveLength(2);
    expect(layout!.points[0]).toEqual({ x: 0, y: 100 });
    expect(layout!.points[1]).toEqual({ x: 100, y: 0 });
  });

  it('builds radar radii from indicator max', () => {
    const layout = buildSkeletonRadarLayout({
      indicators: [
        { name: 'Speed', max: 100 },
        { name: 'Power', max: 50 },
      ],
      series: [{ id: 'a', name: 'A', data: [50, 25] }],
    });
    expect(layout!.series[0]!.radii).toEqual([50, 50]);
  });
});
