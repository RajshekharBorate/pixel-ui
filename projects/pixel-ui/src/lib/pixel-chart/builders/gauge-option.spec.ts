import { buildGaugeChartOption } from './gauge-option';

describe('buildGaugeChartOption', () => {
  it('builds arc gauges', () => {
    const radial = buildGaugeChartOption({
      value: 72,
      variant: 'radial',
      label: 'Performance',
    });
    expect((radial['series'] as { type: string }[])[0]?.type).toBe('gauge');

    const donut = buildGaugeChartOption({ value: 45, variant: 'donut', label: 'CPU' });
    expect((donut['series'] as { type: string }[])[0]?.type).toBe('gauge');
  });

  it('builds linear and bullet as bar charts', () => {
    const linear = buildGaugeChartOption({ value: 68, variant: 'linear', label: 'Done' });
    expect((linear['series'] as { type: string }[])[0]?.type).toBe('bar');

    const bullet = buildGaugeChartOption({
      value: 64,
      target: 80,
      variant: 'bullet',
    });
    expect((bullet['series'] as unknown[]).length).toBeGreaterThan(1);
  });
});
