import {
  buildJpegPdf,
  composeSvgFromChartMarkup,
  resolveChartExportBackground,
} from './chart-image-export';
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

  it('buildJpegPdf writes a downloadable PDF header', () => {
    // Minimal valid JPEG SOI/EOI markers — enough for PDF embedding structure.
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const pdf = buildJpegPdf(jpeg, 10, 8);
    const text = String.fromCharCode(...pdf.slice(0, 8));
    expect(text).toBe('%PDF-1.4');
    expect(String.fromCharCode(...pdf.slice(-5))).toBe('%%EOF');
  });

  it('includes breadcrumb labels in exported SVG chrome', () => {
    const svg = composeSvgFromChartMarkup(
      '<svg><rect width="10" height="10" /></svg>',
      100,
      80,
      {
        background: '#fff',
        foreground: '#111',
        muted: '#555',
        primary: '#1565c0',
        fontFamily: 'sans-serif',
      },
      {
        title: 'Geographic drill-down',
        description: 'Revenue by region',
        breadcrumb: ['World', 'India'],
      },
    );

    expect(svg).toContain('<tspan fill="#555">World</tspan>');
    expect(svg).toContain('<tspan fill="#555"> / </tspan>');
    expect(svg).toContain('<tspan fill="#1565c0">India</tspan>');
    expect(svg).toContain('<g transform="translate(0 76)">');
    expect(svg).toContain('height="156"');
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

  it('applies theme foreground to gauge detail, title, and scale labels', () => {
    const merged = mergeThemedOption(
      theme,
      {
        series: [
          {
            type: 'gauge',
            axisLabel: { show: true, distance: 10 },
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
    const axisLabel = series[0]!['axisLabel'] as { color: string; fontFamily: string };
    expect(detail.color).toBe(theme.textStyle.color);
    expect(title.color).toBe(theme.textStyle.color);
    expect(axisLabel.color).toBe(theme.valueAxis.axisLabel.color);
    expect(axisLabel.fontFamily).toBe(theme.valueAxis.axisLabel.fontFamily);
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
