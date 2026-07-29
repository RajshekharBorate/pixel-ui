import { buildLineChartOption } from './line-option';
import type { PixelChartSeries } from '../pixel-chart.types';

const SERIES: readonly PixelChartSeries[] = [
  { id: 'a', name: 'A', data: [10, 20, 15] },
  { id: 'b', name: 'B', data: [5, 12, 18] },
];

describe('buildLineChartOption', () => {
  it('builds straight multi-series lines', () => {
    const opt = buildLineChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'straight',
      showValues: false,
    });
    expect(opt['series']).toHaveLength(2);
    expect((opt['series'] as { smooth?: boolean }[])[0]?.smooth).toBe(false);
    const xAxis = opt['xAxis'] as {
      axisLabel?: { showMinLabel?: boolean; showMaxLabel?: boolean };
    };
    expect(xAxis.axisLabel).toEqual(
      expect.objectContaining({ showMinLabel: true, showMaxLabel: true }),
    );
  });

  it('applies smooth and step modes', () => {
    const smooth = buildLineChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'smooth',
      showValues: false,
    });
    expect((smooth['series'] as { smooth?: boolean }[])[0]?.smooth).toBe(true);

    const step = buildLineChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'step',
      showValues: false,
    });
    expect((step['series'] as { step?: string }[])[0]?.step).toBe('start');
  });
});
