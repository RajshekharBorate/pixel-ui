import { buildBubbleChartOption, buildBubbleTable } from './bubble-option';

describe('buildBubbleChartOption', () => {
  it('maps size into scatter series', () => {
    const opt = buildBubbleChartOption({
      series: [
        {
          id: 'a',
          name: 'A',
          data: [
            { x: 10, y: 20, size: 5 },
            { x: 15, y: 25, size: 12 },
          ],
        },
      ],
    });
    const series = opt['series'] as { type: string; data: unknown[] }[];
    expect(series[0]?.type).toBe('scatter');
    expect(series[0]?.data).toHaveLength(2);
    expect(buildBubbleTable([{ id: 'a', name: 'A', data: [{ x: 1, y: 2, size: 3 }] }]).rows).toHaveLength(1);
  });
});
