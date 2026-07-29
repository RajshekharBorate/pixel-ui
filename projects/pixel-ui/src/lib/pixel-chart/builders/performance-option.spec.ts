import {
  PIXEL_CHART_MAX_POINTS,
  PIXEL_CHART_PROGRESSIVE_THRESHOLD,
  PIXEL_CHART_SAMPLING_THRESHOLD,
  countCartesianPoints,
  resolveChartPerformance,
  withSeriesPerformance,
} from './performance-option';

describe('performance-option', () => {
  it('documents recommended max points', () => {
    expect(PIXEL_CHART_MAX_POINTS.line).toBe(10_000);
    expect(PIXEL_CHART_MAX_POINTS.bar).toBe(5_000);
  });

  it('auto is off below progressive threshold', () => {
    expect(resolveChartPerformance('auto', PIXEL_CHART_PROGRESSIVE_THRESHOLD - 1)).toBeNull();
  });

  it('auto enables progressive above threshold', () => {
    const preset = resolveChartPerformance('auto', PIXEL_CHART_PROGRESSIVE_THRESHOLD)!;
    expect(preset.large).toBe(true);
    expect(preset.sampling).toBeUndefined();
  });

  it('auto enables LTTB sampling above sampling threshold', () => {
    const preset = resolveChartPerformance('auto', PIXEL_CHART_SAMPLING_THRESHOLD)!;
    expect(preset.sampling).toBe('lttb');
  });

  it('sampled forces LTTB even for small N', () => {
    expect(resolveChartPerformance('sampled', 10)?.sampling).toBe('lttb');
  });

  it('off always returns null', () => {
    expect(resolveChartPerformance('off', 100_000)).toBeNull();
  });

  it('withSeriesPerformance applies flags to line series', () => {
    const opt = withSeriesPerformance(
      { series: [{ id: 'a', type: 'line', data: [1, 2] }] },
      resolveChartPerformance('sampled', 10),
    ) as { series: { sampling?: string; large?: boolean }[]; animation?: boolean };
    expect(opt.animation).toBe(false);
    expect(opt.series[0]!.sampling).toBe('lttb');
    expect(opt.series[0]!.large).toBe(true);
  });

  it('countCartesianPoints multiplies series × categories', () => {
    expect(countCartesianPoints(2, 5000)).toBe(10_000);
  });
});
