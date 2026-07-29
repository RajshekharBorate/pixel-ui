import {
  formatChartAxisLabel,
  normalizeCategoryLabels,
  toChartTimestamp,
} from './time-axis';

describe('time-axis', () => {
  it('parses Date and ISO strings to timestamps', () => {
    const d = new Date('2024-06-15T00:00:00.000Z');
    expect(toChartTimestamp(d)).toBe(d.getTime());
    expect(toChartTimestamp(d.toISOString())).toBe(d.getTime());
    expect(toChartTimestamp(d.getTime())).toBe(d.getTime());
  });

  it('returns null for non-date strings', () => {
    expect(toChartTimestamp('Q1')).toBeNull();
  });

  it('formats with Intl when no adapter', () => {
    const label = formatChartAxisLabel(new Date('2024-01-15T12:00:00'));
    expect(label.length).toBeGreaterThan(0);
  });

  it('normalizeCategoryLabels leaves plain strings', () => {
    expect(normalizeCategoryLabels(['A', 'B'])).toEqual(['A', 'B']);
  });
});
