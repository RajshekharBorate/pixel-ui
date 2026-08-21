import {
  formatChartAxisLabel,
  normalizeCategoryLabels,
  toChartTimestamp,
} from './time-axis';
import type { PixelDateAdapter } from '../../shared/datetime/pixel-date-adapter';
import { defaultFormatDate } from '../../shared/datetime/pixel-date-utils';

describe('time-axis', () => {
  it('parses Date and ISO strings to timestamps', () => {
    const d = new Date('2024-06-15T00:00:00.000Z');
    expect(toChartTimestamp(d)).toBe(d.getTime());
    expect(toChartTimestamp(d.toISOString())).toBe(d.getTime());
    expect(toChartTimestamp(d.getTime())).toBe(d.getTime());
    expect(toChartTimestamp('2024-06-15')).not.toBeNull();
  });

  it('returns null for non-date / ordinal category strings', () => {
    expect(toChartTimestamp('Q1')).toBeNull();
    expect(toChartTimestamp('Jan 23')).toBeNull();
    expect(toChartTimestamp('1')).toBeNull();
    expect(toChartTimestamp('15')).toBeNull();
  });

  it('formats with Intl when no adapter', () => {
    const label = formatChartAxisLabel(new Date('2024-01-15T12:00:00'));
    expect(label.length).toBeGreaterThan(0);
    expect(label).not.toMatch(/iumDate/);
  });

  it('formats via adapter with null displayFormat (not mediumDate)', () => {
    const format = vi.fn((d: Date, displayFormat: unknown) => {
      expect(displayFormat).toBeNull();
      return defaultFormatDate(d, 'en-IN');
    });
    const adapter = {
      fromNativeDate: (d: Date) => d,
      isValid: (d: Date) => !Number.isNaN(d.getTime()),
      format,
    } as unknown as PixelDateAdapter<Date>;

    const label = formatChartAxisLabel(new Date(2024, 0, 15), {
      adapter,
      locale: 'en-IN',
    });
    expect(format).toHaveBeenCalled();
    expect(label).not.toMatch(/iumDate/);
    expect(label).toMatch(/15/);
  });

  it('passes through pre-formatted category labels', () => {
    const adapter = {
      fromNativeDate: (d: Date) => d,
      isValid: () => true,
      format: () => 'SHOULD_NOT_RUN',
    } as unknown as PixelDateAdapter<Date>;
    expect(formatChartAxisLabel('Jan 23', { adapter })).toBe('Jan 23');
    expect(formatChartAxisLabel('1')).toBe('1');
  });

  it('normalizeCategoryLabels leaves plain strings', () => {
    expect(normalizeCategoryLabels(['A', 'B'])).toEqual(['A', 'B']);
  });
});
