import { buildAreaChartOption } from './area-option';
import type { PixelChartSeries } from '../pixel-chart.types';

const SERIES: readonly PixelChartSeries[] = [
  { id: 'a', name: 'A', data: [10, 20, 30] },
  { id: 'b', name: 'B', data: [15, 10, 25] },
];

const AREA_MODES = ['overlay', 'stacked', 'percent', 'stream'] as const;

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
    expect((opt['xAxis'] as { boundaryGap?: boolean }).boundaryGap).toBe(true);
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

  it.each(AREA_MODES)(
    'keeps %s value labels and markers consistent above each point',
    (mode) => {
      const opt = buildAreaChartOption({
        series: SERIES,
        categories: ['Jan', 'Feb', 'Mar'],
        mode,
        showValues: true,
        showMarkers: false,
        valueSuffix: 'K',
      });
      const layers = (
        opt['series'] as {
          id?: string;
          showSymbol?: boolean;
          symbolSize?: number;
          label?: {
            show?: boolean;
            position?: string;
            formatter: (p: { value: number }) => string;
          };
          endLabel?: unknown;
        }[]
      ).filter((s) => s.id !== '__stream-baseline');
      expect(layers.length).toBeGreaterThan(0);
      for (const layer of layers) {
        expect(layer.showSymbol).toBe(true);
        expect(layer.symbolSize).toBe(6);
        expect(layer.label?.show).toBe(true);
        expect(layer.label?.position).toBe('top');
        expect(layer.label?.formatter({ value: 30 })).toBe(mode === 'percent' ? '30%' : '30K');
        expect(layer.endLabel).toBeUndefined();
      }
    },
  );

  it.each(AREA_MODES)('enables persistent markers alone for %s', (mode) => {
    const opt = buildAreaChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode,
      showValues: false,
      showMarkers: true,
    });
    const layer = (
      opt['series'] as { id?: string; showSymbol?: boolean; label?: { show?: boolean } }[]
    ).find((s) => s.id === 'a')!;
    expect(layer.showSymbol).toBe(true);
    expect(layer.label?.show).toBe(false);
  });

  it.each(AREA_MODES)('shows %s values only on hover when values are hidden', (mode) => {
    const opt = buildAreaChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode,
      showValues: false,
      showMarkers: false,
      valueSuffix: 'K',
    });
    const layer = (
      opt['series'] as {
        id?: string;
        showSymbol?: boolean;
        symbolSize?: number;
        label?: { show?: boolean };
        emphasis?: {
          label?: {
            show?: boolean;
            position?: string;
            formatter: (p: { value: number }) => string;
          };
        };
      }[]
    ).find((s) => s.id === 'a')!;
    expect(layer.showSymbol).toBe(true);
    expect(layer.symbolSize).toBe(1);
    expect(layer.label?.show).toBe(false);
    expect(layer.emphasis?.label?.show).toBe(true);
    expect(layer.emphasis?.label?.position).toBe('top');
    expect(layer.emphasis?.label?.formatter({ value: 30 })).toBe(
      mode === 'percent' ? '30%' : '30K',
    );
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

  it('keeps series colors stable when an earlier series is hidden', () => {
    const all = buildAreaChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'overlay',
      showValues: false,
    });
    const hidden = buildAreaChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'overlay',
      showValues: false,
      hiddenSeriesIds: new Set(['a']),
    });
    const colorOf = (opt: ReturnType<typeof buildAreaChartOption>, id: string) =>
      (opt['series'] as { id?: string; itemStyle?: { color?: string } }[]).find((s) => s.id === id)
        ?.itemStyle?.color;
    expect(colorOf(hidden, 'b')).toBe(colorOf(all, 'b'));
  });
});
