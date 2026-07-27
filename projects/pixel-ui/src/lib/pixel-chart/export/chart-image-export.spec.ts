import { resolveChartExportBackground } from './chart-image-export';
import { mergeThemedOption } from '../pixel-chart-host';
import { buildPixelChartEChartsTheme } from '../pixel-chart-theme';
import { ensurePieChart } from '../register/pie.register';
import { buildPieChartOption } from '../builders/pie-option';
import { buildRadarChartOption } from '../builders/radar-option';

describe('chart image export helpers', () => {
  it('resolveChartExportBackground falls back without a chart', () => {
    expect(resolveChartExportBackground(null)).toBe('#ffffff');
    expect(resolveChartExportBackground(undefined, '#111')).toBe('#111');
  });
});

describe('mergeThemedOption axes', () => {
  const theme = buildPixelChartEChartsTheme(document.createElement('div'), 'brand');

  it('does not inject cartesian axes for pie options', () => {
    ensurePieChart();
    const opt = buildPieChartOption({
      slices: [{ id: 'a', name: 'A', value: 10 }],
      mode: 'pie',
      showValues: false,
    });
    const merged = mergeThemedOption(theme, opt, true) as Record<string, unknown>;
    expect(merged['xAxis']).toBeUndefined();
    expect(merged['yAxis']).toBeUndefined();
  });

  it('does not inject cartesian axes for radar options', () => {
    const opt = buildRadarChartOption({
      indicators: [{ name: 'Speed', max: 100 }],
      series: [{ id: 'a', name: 'Team A', data: [80] }],
    });
    const merged = mergeThemedOption(theme, opt, true) as Record<string, unknown>;
    expect(merged['xAxis']).toBeUndefined();
    expect(merged['yAxis']).toBeUndefined();
  });

  it('merges axes when the family option defines them', () => {
    const merged = mergeThemedOption(
      theme,
      {
        xAxis: { type: 'category', data: ['A'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [1] }],
      },
      true,
    ) as Record<string, unknown>;
    expect(merged['xAxis']).toBeDefined();
    expect(merged['yAxis']).toBeDefined();
  });

  it('applies theme foreground to gauge detail and title', () => {
    const merged = mergeThemedOption(
      theme,
      {
        series: [
          {
            type: 'gauge',
            detail: { show: true, fontSize: 28 },
            title: { show: true, fontSize: 13 },
            data: [{ value: 42, name: 'KPI' }],
          },
        ],
      },
      true,
    ) as Record<string, unknown>;
    const series = merged['series'] as Record<string, unknown>[];
    const detail = series[0]!['detail'] as { color: string };
    const title = series[0]!['title'] as { color: string };
    expect(detail.color).toBe(theme.textStyle.color);
    expect(title.color).toBe(theme.textStyle.color);
  });

  it('applies theme foreground to pie / donut center title', () => {
    const merged = mergeThemedOption(
      theme,
      {
        title: {
          text: 'Total\n100',
          textStyle: { fontSize: 14, fontWeight: 600 },
        },
        series: [{ type: 'pie', data: [{ value: 1 }], label: { show: true } }],
      },
      true,
    ) as Record<string, unknown>;
    const title = merged['title'] as { textStyle: { color: string } };
    expect(title.textStyle.color).toBe(theme.textStyle.color);
    const series = merged['series'] as Record<string, unknown>[];
    const label = series[0]!['label'] as { color: string };
    expect(label.color).toBe(theme.textStyle.color);
  });
});
