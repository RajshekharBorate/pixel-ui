import { buildGaugeChartOption } from './gauge-option';

describe('buildGaugeChartOption', () => {
  it('builds arc gauges', () => {
    const radial = buildGaugeChartOption({
      value: 72,
      variant: 'radial',
      label: 'Performance',
      showTicks: true,
    });
    const radialSeries = (radial['series'] as {
      type: string;
      radius?: string;
      axisLabel?: { distance?: number; formatter?: (value: number) => string };
      axisTick?: { show?: boolean; splitNumber?: number };
      splitLine?: { show?: boolean };
    }[])[0];
    expect(radialSeries?.type).toBe('gauge');
    expect(radialSeries?.radius).toBe('82%');
    expect(radialSeries?.axisLabel?.distance).toBe(-25);
    expect(radialSeries?.axisLabel?.formatter?.(0)).toBe('0');
    expect(radialSeries?.axisLabel?.formatter?.(50)).toBe('50');
    expect(radialSeries?.axisLabel?.formatter?.(100)).toBe('100');
    expect(radialSeries?.axisTick).toEqual(
      expect.objectContaining({ show: true, splitNumber: 5 }),
    );
    expect(radialSeries?.splitLine?.show).toBe(true);

    const radialNoTicks = buildGaugeChartOption({
      value: 72,
      variant: 'radial',
      showTicks: false,
    });
    const radialNoTicksSeries = (radialNoTicks['series'] as {
      axisTick?: { show?: boolean };
      splitLine?: { show?: boolean };
      axisLabel?: { distance?: number };
    }[])[0];
    expect(radialNoTicksSeries?.axisTick?.show).toBe(false);
    expect(radialNoTicksSeries?.splitLine?.show).toBe(false);
    expect(radialNoTicksSeries?.axisLabel?.distance).toBe(-16);

    const donut = buildGaugeChartOption({ value: 45, variant: 'donut', label: 'CPU' });
    const donutSeries = (donut['series'] as {
      type: string;
      detail?: { formatter?: (value: number) => string };
    }[])[0];
    expect(donutSeries?.type).toBe('gauge');
    expect(donutSeries?.detail?.formatter?.(45)).toContain('0 — 100');
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

    const multi = buildGaugeChartOption({
      value: 72,
      variant: 'multi-range',
      showTicks: true,
    });
    const multiSeries = (multi['series'] as {
      splitNumber?: number;
      pointer?: { show?: boolean; icon?: string; width?: number };
      anchor?: { showAbove?: boolean; size?: number };
      splitLine?: { show?: boolean; distance?: number };
      axisLabel?: { distance?: number };
      detail?: { offsetCenter?: unknown[] };
    }[])[0];
    expect(multiSeries?.splitNumber).toBe(4);
    expect(multiSeries?.pointer?.show).toBe(true);
    expect(multiSeries?.pointer?.icon).toContain('path://');
    expect(multiSeries?.pointer?.width).toBe(10);
    expect(multiSeries?.anchor).toEqual(expect.objectContaining({ showAbove: true, size: 13 }));
    expect(multiSeries?.splitLine).toEqual(
      expect.objectContaining({ show: true, distance: -18 }),
    );
    expect(multiSeries?.axisLabel?.distance).toBe(-16);
    expect(multiSeries?.detail?.offsetCenter).toEqual([0, '38%']);

    const dual = buildGaugeChartOption({ value: 72, target: 80, variant: 'dual' });
    expect((dual['series'] as unknown[]).length).toBe(2);

    const tick = buildGaugeChartOption({ value: 72, variant: 'tick' });
    const tickSeries = (tick['series'] as {
      axisTick?: { show?: boolean };
      axisLabel?: { distance?: number };
      pointer?: { icon?: string; width?: number };
      anchor?: { showAbove?: boolean; size?: number };
      detail?: { offsetCenter?: unknown[] };
    }[])[0];
    expect(tickSeries?.axisTick?.show).toBe(true);
    expect(tickSeries?.axisLabel?.distance).toBe(-30);
    expect(tickSeries?.pointer?.icon).toContain('path://');
    expect(tickSeries?.pointer?.width).toBe(10);
    expect(tickSeries?.anchor).toEqual(expect.objectContaining({ showAbove: true, size: 12 }));
    expect(tickSeries?.detail?.offsetCenter).toEqual([0, '38%']);

    const multiHidden = buildGaugeChartOption({
      value: 72,
      variant: 'multi-range',
      showTicks: false,
    });
    const multiHiddenSeries = (multiHidden['series'] as {
      splitLine?: { show?: boolean };
      axisLabel?: { distance?: number };
    }[])[0];
    expect(multiHiddenSeries?.splitLine?.show).toBe(false);
    expect(multiHiddenSeries?.axisLabel?.distance).toBe(-16);

    const tickHidden = buildGaugeChartOption({ value: 72, variant: 'tick', showTicks: false });
    const tickHiddenSeries = (tickHidden['series'] as {
      axisTick?: { show?: boolean };
      splitLine?: { show?: boolean };
      axisLabel?: { distance?: number };
    }[])[0];
    expect(tickHiddenSeries?.axisTick?.show).toBe(true);
    expect(tickHiddenSeries?.splitLine?.show).toBe(true);
    expect(tickHiddenSeries?.axisLabel?.distance).toBe(-30);

    const vertical = buildGaugeChartOption({ value: 68, variant: 'vertical' });
    expect((vertical['series'] as { type: string }[])[0]?.type).toBe('bar');
    expect(vertical['yAxis']).toEqual(expect.objectContaining({ type: 'value' }));
  });

  it('puts min/max and current value inside linear, bullet, and vertical gauges', () => {
    const linear = buildGaugeChartOption({
      value: 68,
      min: 10,
      max: 90,
      variant: 'linear',
      label: 'Done',
    });
    const linearAxis = linear['xAxis'] as {
      show?: boolean;
      axisLabel?: { formatter?: (value: number) => string };
    };
    expect(linearAxis.show).toBe(true);
    expect(linearAxis.axisLabel?.formatter?.(0)).toBe('10');
    expect(linearAxis.axisLabel?.formatter?.(100)).toBe('90');

    const bullet = buildGaugeChartOption({
      value: 64,
      min: 0,
      max: 100,
      variant: 'bullet',
    });
    const bulletSeries = bullet['series'] as {
      markPoint?: { label?: { formatter?: () => string } };
    }[];
    expect(bulletSeries.at(-1)?.markPoint?.label?.formatter?.()).toBe('64');

    const vertical = buildGaugeChartOption({
      value: 68,
      min: 0,
      max: 100,
      variant: 'vertical',
    });
    expect((vertical['yAxis'] as { show?: boolean }).show).toBe(true);
  });
});
