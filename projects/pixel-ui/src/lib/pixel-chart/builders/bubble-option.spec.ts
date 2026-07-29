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

  it('builds pack layout as custom series', () => {
    const opt = buildBubbleChartOption({
      layout: 'pack',
      series: [],
      hierarchy: [
        {
          name: 'Root',
          children: [
            { name: 'A', value: 10 },
            { name: 'B', value: 20 },
            {
              name: 'Group',
              children: [
                { name: 'C', value: 8 },
                { name: 'D', value: 12 },
              ],
            },
          ],
        },
      ],
    });
    expect((opt['series'] as { type: string }[])[0]?.type).toBe('custom');
    expect((opt['series'] as { data: unknown[] }[])[0]?.data.length).toBeGreaterThan(3);
    expect((opt['xAxis'] as { show?: boolean }).show).toBe(false);
  });
});
