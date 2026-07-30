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
      boundaryGap?: boolean;
      axisLabel?: { showMinLabel?: boolean; showMaxLabel?: boolean };
    };
    expect(xAxis.boundaryGap).toBe(true);
    expect(xAxis.axisLabel).toEqual(
      expect.objectContaining({ showMinLabel: true, showMaxLabel: true }),
    );
    expect((opt['series'] as { lineStyle?: { width?: number }; symbolSize?: number }[])[0]?.lineStyle?.width).toBe(2);
    expect((opt['series'] as { symbolSize?: number }[])[0]?.symbolSize).toBe(8);
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

  it('enables symbols and hover labels when values are shown or hidden', () => {
    const shown = buildLineChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'straight',
      showValues: true,
      showMarkers: false,
    });
    const shownSeries = shown['series'] as {
      showSymbol?: boolean;
      label?: { show?: boolean; position?: string };
      emphasis?: { label?: { show?: boolean } };
    }[];
    expect(shownSeries[0]?.showSymbol).toBe(true);
    expect(shownSeries[0]?.label?.show).toBe(true);
    expect(shownSeries[0]?.label?.position).toBe('top');

    const hidden = buildLineChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'straight',
      showValues: false,
      showMarkers: false,
    });
    const hiddenSeries = hidden['series'] as {
      showSymbol?: boolean;
      label?: { show?: boolean };
      emphasis?: { label?: { show?: boolean } };
    }[];
    expect(hiddenSeries[0]?.showSymbol).toBe(false);
    expect(hiddenSeries[0]?.label?.show).toBe(false);
    expect(hiddenSeries[0]?.emphasis?.label?.show).toBe(true);
  });

  it('applies axis names and value suffix', () => {
    const opt = buildLineChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'straight',
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

  it('adds references and configures an axis pointer', () => {
    const option = buildLineChartOption({
      series: SERIES,
      categories: ['Jan', 'Feb', 'Mar'],
      mode: 'straight',
      showValues: false,
      axisPointer: 'cross',
      referenceLines: [{ id: 'target', value: 20, label: 'Target' }],
    });
    expect((option['tooltip'] as { axisPointer?: { type?: string } }).axisPointer?.type).toBe('cross');
    expect((option['series'] as { markLine?: unknown }[])[0]?.markLine).toBeDefined();
  });

  it('disables animation only when the selected performance preset is active', () => {
    const categories = Array.from({ length: 1000 }, (_, index) => String(index + 1));
    const series = SERIES.map((item) => ({
      ...item,
      data: Array.from({ length: 1000 }, (_, index) => index),
    }));
    const auto = buildLineChartOption({
      series,
      categories,
      mode: 'straight',
      showValues: false,
      performance: 'auto',
    }) as { animation?: boolean };
    const off = buildLineChartOption({
      series,
      categories,
      mode: 'straight',
      showValues: false,
      performance: 'off',
    }) as { animation?: boolean };
    expect(auto.animation).toBe(false);
    expect(off.animation).toBeUndefined();
  });
});
