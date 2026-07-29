import { buildAreaChartOption } from './area-option';
import type { PixelChartSeries } from '../pixel-chart.types';

const SERIES: readonly PixelChartSeries[] = [
  { id: 'a', name: 'A', data: [10, 20, 30] },
  { id: 'b', name: 'B', data: [15, 10, 25] },
];

describe('buildAreaChartOption', () => {
  it('builds overlay areas without stack', () => {
    const opt = buildAreaChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'overlay',
      showValues: false,
    });
    expect(opt['series']).toHaveLength(2);
    expect((opt['series'] as { stack?: string; areaStyle?: object }[])[0]?.stack).toBeUndefined();
    expect((opt['series'] as { areaStyle?: object }[])[0]?.areaStyle).toBeTruthy();
  });

  it('stacks and percent-normalizes', () => {
    const stacked = buildAreaChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'stacked',
      showValues: false,
    });
    expect((stacked['series'] as { stack?: string }[])[0]?.stack).toBe('pixel');

    const percent = buildAreaChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'percent',
      showValues: false,
    });
    const first = (percent['series'] as { data: (number | null)[] }[])[0]!.data[0];
    expect(first).toBeCloseTo(40, 5);
  });

  it('builds stream mode as centered stacked areas', () => {
    const stream = buildAreaChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'stream',
      showValues: false,
    });
    const series = stream['series'] as { id?: string; stack?: string; type?: string; data?: number[] }[];
    expect(series[0]?.id).toBe('__stream-baseline');
    expect(series[0]?.stack).toBe('stream');
    expect(series[0]?.data?.[0]).toBeCloseTo(-12.5, 5); // -(10+15)/2
    expect(series.slice(1).every((s) => s.type === 'line' && s.stack === 'stream')).toBe(true);
    expect(series).toHaveLength(3);
  });
});
