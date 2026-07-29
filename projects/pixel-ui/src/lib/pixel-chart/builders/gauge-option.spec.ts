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

  it('builds Phase 2 solid / multi-range / dual / tick / vertical', () => {
    const solid = buildGaugeChartOption({ value: 72, variant: 'solid' });
    expect((solid['series'] as { type: string }[])[0]?.type).toBe('gauge');

    const multi = buildGaugeChartOption({ value: 72, variant: 'multi-range' });
    const multiSeries = (multi['series'] as { pointer?: { show?: boolean } }[])[0];
    expect(multiSeries?.pointer?.show).toBe(true);

    const dual = buildGaugeChartOption({ value: 72, target: 80, variant: 'dual' });
    expect((dual['series'] as unknown[]).length).toBe(2);

    const tick = buildGaugeChartOption({ value: 72, variant: 'tick' });
    const tickSeries = (tick['series'] as { axisTick?: { show?: boolean } }[])[0];
    expect(tickSeries?.axisTick?.show).toBe(true);

    const vertical = buildGaugeChartOption({ value: 68, variant: 'vertical' });
    expect((vertical['series'] as { type: string }[])[0]?.type).toBe('bar');
    expect(vertical['yAxis']).toEqual(expect.objectContaining({ type: 'value' }));
  });
});
