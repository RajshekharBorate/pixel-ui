import {
  buildRadarChartOption,
  buildRadarTable,
  formatRadarIndicatorName,
} from './radar-option';

const INDICATORS = [
  { name: 'Speed', max: 100, group: 'Delivery' },
  { name: 'Quality', max: 100, group: 'Delivery' },
  { name: 'Support', max: 100 },
] as const;

describe('buildRadarChartOption', () => {
  it('builds line and filled modes', () => {
    const line = buildRadarChartOption({
      indicators: INDICATORS,
      series: [{ id: 'a', name: 'A', data: [80, 70, 60] }],
      mode: 'line',
    });
    expect((line['series'] as { type: string }[])[0]?.type).toBe('radar');

    const filled = buildRadarChartOption({
      indicators: INDICATORS,
      series: [{ id: 'a', name: 'A', data: [80, 70, 60] }],
      mode: 'filled',
    });
    expect((filled['series'] as { areaStyle?: unknown }[])[0]?.areaStyle).toBeTruthy();
  });

  it('adds target overlay', () => {
    const opt = buildRadarChartOption({
      indicators: INDICATORS,
      series: [{ id: 'a', name: 'A', data: [80, 70, 60] }],
      mode: 'target',
      target: [90, 90, 90],
    });
    const series = opt['series'] as { id?: string }[];
    expect(series.some((s) => s.id === '__target')).toBe(true);
    expect(
      buildRadarTable(INDICATORS, [{ id: 'a', name: 'A', data: [1, 2, 3] }], [9, 9, 9]).columns,
    ).toHaveLength(3);
  });

  it('formats multi-level indicator names', () => {
    expect(formatRadarIndicatorName(INDICATORS[0]!)).toBe('Delivery\nSpeed');
    expect(formatRadarIndicatorName(INDICATORS[2]!)).toBe('Support');
  });

  it('builds Phase 2 range / threshold / polar-area', () => {
    const range = buildRadarChartOption({
      indicators: INDICATORS,
      series: [{ id: 'a', name: 'A', data: [80, 70, 60] }],
      mode: 'range',
      rangeLow: [40, 40, 40],
      rangeHigh: [90, 90, 90],
    });
    const rangeIds = (range['series'] as { id?: string }[]).map((s) => s.id);
    expect(rangeIds).toContain('__range-high');
    expect(rangeIds).toContain('__range-low');
    expect(rangeIds).toContain('a');

    const threshold = buildRadarChartOption({
      indicators: INDICATORS,
      series: [{ id: 'a', name: 'A', data: [80, 70, 60] }],
      mode: 'threshold',
      thresholds: [40, 70],
    });
    expect(
      (threshold['series'] as { id?: string }[]).filter((s) => s.id?.startsWith('__threshold')),
    ).toHaveLength(2);

    const polar = buildRadarChartOption({
      indicators: INDICATORS,
      series: [{ id: 'a', name: 'A', data: [80, 70, 60] }],
      mode: 'polar-area',
    });
    expect(polar['polar']).toBeTruthy();
    expect((polar['series'] as { type: string }[])[0]?.type).toBe('bar');
  });
});
