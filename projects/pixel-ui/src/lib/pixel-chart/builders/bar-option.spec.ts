import { buildBarChartOption } from './bar-option';
import type { PixelChartSeries } from '../pixel-chart.types';

const SERIES: readonly PixelChartSeries[] = [
  { id: 'a', name: 'Product A', data: [10, 20, 30] },
  { id: 'b', name: 'Product B', data: [15, 10, 25] },
];

describe('buildBarChartOption', () => {
  it('builds grouped vertical bars', () => {
    const opt = buildBarChartOption({
      series: SERIES,
      categories: ['Q1', 'Q2', 'Q3'],
      mode: 'grouped',
      orientation: 'vertical',
      showValues: false,
    });
    expect(opt['series']).toHaveLength(2);
    expect((opt['series'] as { stack?: string }[])[0]?.stack).toBeUndefined();
    expect((opt['xAxis'] as { type: string }).type).toBe('category');
  });

  it('stacks and percent-normalizes', () => {
    const stacked = buildBarChartOption({
      series: SERIES,
      categories: ['Q1', 'Q2', 'Q3'],
      mode: 'stacked',
      orientation: 'vertical',
      showValues: true,
      patternFill: true,
    });
    expect((stacked['series'] as { stack?: string }[])[0]?.stack).toBe('pixel');
    const total = (
      stacked['series'] as {
        id?: string;
        label?: { formatter?: (params: { dataIndex: number }) => string };
      }[]
    ).find((series) => series.id === '__stack-total');
    expect(total?.label?.formatter?.({ dataIndex: 0 })).toBe('25');
    expect((total as { itemStyle?: { decal?: unknown } })?.itemStyle?.decal).toBeUndefined();

    const horizontalStacked = buildBarChartOption({
      series: SERIES,
      categories: ['Q1', 'Q2', 'Q3'],
      mode: 'stacked',
      orientation: 'horizontal',
      showValues: true,
    });
    const horizontalSeries = horizontalStacked['series'] as {
      id?: string;
      label?: { position?: string };
    }[];
    expect(horizontalSeries.find((item) => item.id === 'a')?.label?.position).toBe('inside');
    expect(
      horizontalSeries.find((item) => item.id === '__stack-total')?.label?.position,
    ).toBe('right');

    const percent = buildBarChartOption({
      series: SERIES,
      categories: ['Q1', 'Q2', 'Q3'],
      mode: 'percent',
      orientation: 'vertical',
      showValues: false,
    });
    const first = (percent['series'] as { data: (number | null)[] }[])[0]!.data[0];
    expect(first).toBeCloseTo(40, 5); // 10/25 * 100
  });

  it('swaps axes for horizontal orientation', () => {
    const opt = buildBarChartOption({
      series: SERIES,
      categories: ['Q1', 'Q2', 'Q3'],
      mode: 'single',
      orientation: 'horizontal',
      showValues: false,
    });
    expect((opt['yAxis'] as { type: string }).type).toBe('category');
    expect((opt['xAxis'] as { type: string }).type).toBe('value');
  });

  it('hides series listed in hiddenSeriesIds', () => {
    const opt = buildBarChartOption({
      series: SERIES,
      categories: ['Q1', 'Q2', 'Q3'],
      mode: 'grouped',
      orientation: 'vertical',
      showValues: false,
      hiddenSeriesIds: new Set(['b']),
    });
    expect(opt['series']).toHaveLength(1);
    expect((opt['series'] as { id: string }[])[0]?.id).toBe('a');
  });

  it('shows values on bars and still exposes hover labels when hidden', () => {
    const shown = buildBarChartOption({
      series: SERIES,
      categories: ['Q1', 'Q2', 'Q3'],
      mode: 'grouped',
      orientation: 'vertical',
      showValues: true,
    });
    const shownLabel = (shown['series'] as { label: { show?: boolean; position?: string } }[])[0]!
      .label;
    expect(shownLabel.show).toBe(true);
    expect(shownLabel.position).toBe('top');

    const hidden = buildBarChartOption({
      series: SERIES,
      categories: ['Q1', 'Q2', 'Q3'],
      mode: 'grouped',
      orientation: 'vertical',
      showValues: false,
    });
    const hiddenSeries = hidden['series'] as {
      label?: { show?: boolean };
      emphasis?: { label?: { show?: boolean } };
    }[];
    expect(hiddenSeries[0]?.label?.show).toBe(false);
    expect(hiddenSeries[0]?.emphasis?.label?.show).toBe(true);
  });

  it('applies axis names and value suffix', () => {
    const opt = buildBarChartOption({
      series: SERIES,
      categories: ['Q1', 'Q2', 'Q3'],
      mode: 'grouped',
      orientation: 'vertical',
      showValues: true,
      xAxisName: 'Quarter',
      yAxisName: 'Sales (in K)',
      valueSuffix: 'K',
    });
    const xAxis = opt['xAxis'] as { name?: string };
    const yAxis = opt['yAxis'] as { name?: string };
    expect(xAxis.name).toBe('Quarter');
    expect(yAxis.name).toBe('Sales (in K)');
    const label = (opt['series'] as { label: { formatter: (p: { value: number }) => string } }[])[0]!
      .label;
    expect(label.formatter({ value: 85 })).toBe('85K');
    const tip = (opt['tooltip'] as { valueFormatter: (v: unknown) => string }).valueFormatter;
    expect(tip(85)).toBe('85K');
  });
});
