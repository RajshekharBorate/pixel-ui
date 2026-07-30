import {
  axisPointerFields,
  buildReferenceMarkLine,
  valueAxisLabelFields,
  withSeriesReferences,
} from './reference-option';

describe('reference-option', () => {
  it('builds mark lines and attaches references to the first series', () => {
    const markLine = buildReferenceMarkLine([{ id: 'target', value: 80 }]);
    expect(markLine).toEqual(expect.objectContaining({ data: expect.any(Array) }));

    const series = withSeriesReferences(
      [{ id: 'revenue' }, { id: 'costs' }],
      { referenceLines: [{ id: 'target', value: 80 }] },
    );
    expect(series[0]).toEqual(expect.objectContaining({ markLine: expect.any(Object) }));
    expect(series[1]).not.toHaveProperty('markLine');
  });

  it('formats percent and currency value-axis labels', () => {
    expect(
      (valueAxisLabelFields({ percent: true }).axisLabel as { formatter?: string })?.formatter,
    ).toBe('{value}%');
    const currency = (
      valueAxisLabelFields({
        axisValueFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
        locale: 'en-US',
      }).axisLabel as { formatter: (value: number) => string }
    ).formatter;
    expect(currency(1200)).toBe('$1,200');
  });

  it('maps none and line axis pointers', () => {
    expect(axisPointerFields('none')).toEqual({ axisPointer: { type: 'none' } });
    expect(axisPointerFields('line')).toEqual({ axisPointer: { type: 'line' } });
  });
});
