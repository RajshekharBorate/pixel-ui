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

  it.each(['stacked', 'percent'] as const)(
    'positions %s labels above hover markers like overlay mode',
    (mode) => {
      const opt = buildAreaChartOption({
        series: SERIES,
        categories: ['Jan', 'Feb', 'Mar'],
        mode,
        showValues: true,
      });
      const label = (opt['series'] as { label: { position?: string } }[])[0]!.label;
      expect(label.position).toBe('top');
    },
  );

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

  it('applies axis names and value suffix', () => {
    const opt = buildAreaChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'overlay',
      showValues: true,
      xAxisName: 'Month',
      yAxisName: 'Sales (in K)',
      valueSuffix: 'K',
    });
    const xAxis = opt['xAxis'] as { name?: string };
    const yAxis = opt['yAxis'] as { name?: string };
    expect(xAxis.name).toBe('Month');
    expect(yAxis.name).toBe('Sales (in K)');
    const label = (opt['series'] as { label: { formatter: (p: { value: number }) => string } }[])[0]!
      .label;
    expect(label.formatter({ value: 85 })).toBe('85K');
    const tip = (opt['tooltip'] as { valueFormatter: (v: unknown) => string }).valueFormatter;
    expect(tip(85)).toBe('85K');
  });

  it('uses an end label without suppressing stream hover markers', () => {
    const stream = buildAreaChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'stream',
      showValues: true,
      valueSuffix: 'K',
    });
    const series = stream['series'] as {
      id?: string;
      showSymbol?: boolean;
      symbolSize?: number;
      endLabel?: { show?: boolean; formatter: (p: { value: number }) => string };
      emphasis?: {
        label?: {
          show?: boolean;
          formatter: (p: { value: number; dataIndex: number }) => string;
        };
      };
    }[];
    const layer = series.find((s) => s.id === 'a')!;
    expect(layer.showSymbol).toBe(false);
    expect(layer.symbolSize).toBe(8);
    expect(layer.endLabel!.show).toBe(true);
    expect(layer.endLabel!.formatter({ value: 30 })).toBe('30K');
    expect(layer.emphasis!.label!.show).toBe(true);
    expect(layer.emphasis!.label!.formatter({ value: 20, dataIndex: 1 })).toBe('20K');
    expect(layer.emphasis!.label!.formatter({ value: 30, dataIndex: 2 })).toBe('');
  });
});
