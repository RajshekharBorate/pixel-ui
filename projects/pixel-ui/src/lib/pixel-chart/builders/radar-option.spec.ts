import { buildRadarChartOption, buildRadarTable } from './radar-option';

const INDICATORS = [
  { name: 'Speed', max: 100 },
  { name: 'Quality', max: 100 },
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
    expect(buildRadarTable(INDICATORS, [{ id: 'a', name: 'A', data: [1, 2, 3] }], [9, 9, 9]).columns).toHaveLength(3);
  });
});
