import { buildPieChartOption, buildPieTable } from './pie-option';

const SLICES = [
  { id: 'a', name: 'A', value: 35 },
  { id: 'b', name: 'B', value: 25 },
  { id: 'c', name: 'C', value: 40 },
] as const;

describe('buildPieChartOption', () => {
  it('builds a full pie series', () => {
    const opt = buildPieChartOption({
      slices: SLICES,
      mode: 'pie',
      showValues: false,
    });
    const series = opt['series'] as { type: string; radius: string[] }[];
    expect(series[0]?.type).toBe('pie');
    expect(series[0]?.radius[0]).toBe('0%');
  });

  it('uses ring radius for donut and semi', () => {
    const donut = buildPieChartOption({
      slices: SLICES,
      mode: 'donut',
      showValues: false,
    });
    expect((donut['series'] as { radius: string[] }[])[0]?.radius[0]).toBe('48%');

    const semi = buildPieChartOption({
      slices: SLICES,
      mode: 'semi',
      showValues: false,
    });
    expect((semi['series'] as { startAngle?: number }[])[0]?.startAngle).toBe(180);
  });

  it('buildPieTable includes total row', () => {
    const table = buildPieTable(SLICES);
    expect(table.rows).toHaveLength(4);
    expect(table.rows[3]?.['name']).toBe('Total');
    expect(table.rows[3]?.['value']).toBe(100);
  });
});
