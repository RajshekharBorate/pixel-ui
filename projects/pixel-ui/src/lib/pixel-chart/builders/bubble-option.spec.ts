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

  it('toggles cartesian labels and pack leaf labels via showValues', () => {
    const shown = buildBubbleChartOption({
      series: [
        {
          id: 'a',
          name: 'A',
          data: [
            { x: 10, y: 20, size: 5, label: 'Alpha' },
            { x: 15, y: 25, size: 12 },
          ],
        },
      ],
      showValues: true,
    });
    const shownSeries = shown['series'] as {
      label?: {
        show?: boolean;
        formatter?: (p: { value?: number[]; data?: { label?: string } }) => string;
      };
      emphasis?: { label?: { show?: boolean } };
    }[];
    expect(shownSeries[0]?.label?.show).toBe(true);
    expect(shownSeries[0]?.label?.formatter?.({ data: { label: 'Alpha' }, value: [10, 20, 5] })).toBe(
      'Alpha',
    );
    expect(shownSeries[0]?.label?.formatter?.({ value: [15, 25, 12] })).toBe('12');

    const hidden = buildBubbleChartOption({
      series: [
        {
          id: 'a',
          name: 'A',
          data: [{ x: 10, y: 20, size: 5 }],
        },
      ],
      showValues: false,
    });
    expect((hidden['series'] as { label?: { show?: boolean } }[])[0]?.label?.show).toBe(false);
    expect(
      (hidden['series'] as { emphasis?: { label?: { show?: boolean } } }[])[0]?.emphasis?.label
        ?.show,
    ).toBe(true);

    const packHidden = buildBubbleChartOption({
      layout: 'pack',
      series: [],
      showValues: false,
      hierarchy: [{ name: 'Root', children: [{ name: 'A', value: 10 }] }],
    });
    expect((packHidden['series'] as { label?: { show?: boolean } }[])[0]?.label?.show).toBe(false);
  });
});
