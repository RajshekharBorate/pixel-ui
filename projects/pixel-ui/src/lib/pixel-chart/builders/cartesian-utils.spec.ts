import {
  axisLineFields,
  defaultCartesianGrid,
  formatChartValue,
  resolveAxisLineShow,
  resolveAxisSplitLineShow,
  resolveCartesianGrid,
  splitLineFields,
} from './cartesian-utils';

describe('cartesian-utils Phase 1 layout helpers', () => {
  it('builds and merges plot padding', () => {
    const base = defaultCartesianGrid({ xAxisName: 'Month', yAxisName: 'Sales' });
    expect(base.left).toBe(64);
    expect(base.bottom).toBe(56);
    expect(resolveCartesianGrid(base, { left: 80, top: 12 })).toEqual({
      left: 80,
      right: 32,
      top: 12,
      bottom: 56,
    });
  });

  it('formats currency and keeps valueSuffix as shorthand', () => {
    expect(
      formatChartValue(1200, false, {
        format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
        locale: 'en-US',
      }),
    ).toBe('$1,200');
    expect(formatChartValue(85, false, { suffix: 'K' })).toBe('85K');
    expect(
      formatChartValue(85, false, {
        suffix: 'K',
        format: { style: 'decimal', maximumFractionDigits: 0, suffix: 'K' },
        locale: 'en-US',
      }),
    ).toBe('85K');
    expect(formatChartValue(null, false, { nullLabel: 'No value' })).toBe('No value');
  });
});
