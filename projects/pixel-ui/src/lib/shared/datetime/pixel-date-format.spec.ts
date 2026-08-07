import {
  formatDateBySpec,
  formatDatePattern,
  localeDateFormatHint,
  parseDateBySpec,
  parseDatePattern,
} from './pixel-date-utils';

describe('date format patterns', () => {
  const sample = new Date(2024, 5, 15);

  it('formats and parses dd/MM/yyyy round-trip', () => {
    expect(formatDatePattern(sample, 'dd/MM/yyyy')).toBe('15/06/2024');
    const parsed = parseDatePattern('15/06/2024', 'dd/MM/yyyy');
    expect(parsed?.getFullYear()).toBe(2024);
    expect(parsed?.getMonth()).toBe(5);
    expect(parsed?.getDate()).toBe(15);
  });

  it('parses flexible d/M/yyyy', () => {
    const parsed = parseDatePattern('15/6/2024', 'd/M/yyyy');
    expect(parsed?.getDate()).toBe(15);
    expect(parsed?.getMonth()).toBe(5);
  });

  it('rejects impossible calendar dates', () => {
    expect(parseDatePattern('31/02/2024', 'dd/MM/yyyy')).toBeNull();
  });

  it('formatDateBySpec uses pattern strings and Intl options', () => {
    expect(formatDateBySpec(sample, 'dd/MM/yyyy')).toBe('15/06/2024');
    expect(formatDateBySpec(sample, { year: 'numeric', month: 'numeric', day: 'numeric' }, 'en-GB')).toMatch(
      /15/,
    );
  });

  it('parseDateBySpec tries pattern arrays and always accepts ISO', () => {
    const formats = ['dd/MM/yyyy', 'd/M/yyyy'];
    expect(parseDateBySpec('15/06/2024', formats)?.getDate()).toBe(15);
    expect(parseDateBySpec('2024-06-15', formats)?.getDate()).toBe(15);
  });

  it('localeDateFormatHint follows locale field order', () => {
    expect(localeDateFormatHint('en-US')).toBe('MM/DD/YYYY');
    expect(localeDateFormatHint('en-GB')).toBe('DD/MM/YYYY');
  });
});
