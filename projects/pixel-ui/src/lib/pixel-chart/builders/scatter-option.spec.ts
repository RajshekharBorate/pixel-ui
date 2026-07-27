import { computeScatterStats } from './scatter-stats';
import { buildScatterChartOption, buildScatterStats } from './scatter-option';

describe('scatter stats / option', () => {
  it('computes perfect positive correlation', () => {
    const stats = computeScatterStats([
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
    ]);
    expect(stats).toBeTruthy();
    expect(stats!.r).toBeCloseTo(1, 5);
    expect(stats!.r2).toBeCloseTo(1, 5);
  });

  it('builds scatter series and optional trendline', () => {
    const opt = buildScatterChartOption({
      series: [
        {
          id: 'a',
          name: 'A',
          data: [
            { x: 1, y: 2 },
            { x: 2, y: 4 },
            { x: 3, y: 5 },
          ],
        },
      ],
      showTrendline: true,
    });
    const series = opt['series'] as { type: string; id?: string }[];
    expect(series.some((s) => s.type === 'scatter')).toBe(true);
    expect(series.some((s) => s.id === '__trendline')).toBe(true);
    expect(buildScatterStats([{ id: 'a', name: 'A', data: [{ x: 1, y: 1 }, { x: 2, y: 2 }] }])).toBeTruthy();
  });
});
