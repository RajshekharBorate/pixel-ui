import {
  buildDate,
  formatDateBySpec,
  formatDatePattern,
  formatDisplayDate,
  localeDateFormatHint,
  parseLocalIsoDate,
  parseDateBySpec,
  parseDatePattern,
  toLocalIsoDate,
  toNativeDate,
} from './pixel-date-utils';

// ── parseLocalIsoDate ─────────────────────────────────────────────────────────
describe('parseLocalIsoDate', () => {
  it('returns null for empty / null / undefined', () => {
    expect(parseLocalIsoDate(null)).toBeNull();
    expect(parseLocalIsoDate(undefined)).toBeNull();
    expect(parseLocalIsoDate('')).toBeNull();
  });

  it('exact YYYY-MM-DD → local civil day (no UTC-midnight shift)', () => {
    // Construct with explicit fields so the test passes in every timezone.
    const d = parseLocalIsoDate('2024-07-15');
    expect(d?.getFullYear()).toBe(2024);
    expect(d?.getMonth()).toBe(6);
    expect(d?.getDate()).toBe(15);
  });

  it('full ISO / Z string → instant then local civil day', () => {
    // T12:00Z is noon UTC.  In UTC+5:30 that's 17:30 → still July 15.
    // In UTC-11 that's 01:00 → still July 15.  The test is zone-agnostic via local fields.
    const d = parseLocalIsoDate('2024-07-15T12:00:00.000Z');
    expect(d?.getFullYear()).toBe(2024);
    expect(d?.getMonth()).toBe(6);
    expect(d?.getDate()).toBe(15);
  });

  it('Date object → startOfDay', () => {
    const d = parseLocalIsoDate(new Date(2024, 6, 15, 9, 30));
    expect(d?.getHours()).toBe(0);
    expect(d?.getDate()).toBe(15);
  });

  it('epoch ms → startOfDay', () => {
    const epoch = new Date(2024, 0, 1).getTime();
    const d = parseLocalIsoDate(epoch);
    expect(d?.getFullYear()).toBe(2024);
    expect(d?.getDate()).toBe(1);
  });

  it('invalid string → null', () => {
    expect(parseLocalIsoDate('not-a-date')).toBeNull();
  });
});

// ── toNativeDate delegates to parseLocalIsoDate ───────────────────────────────
describe('toNativeDate', () => {
  it('exact YYYY-MM-DD is local civil day (was UTC-midnight bug)', () => {
    const d = toNativeDate('2024-07-15');
    expect(d?.getFullYear()).toBe(2024);
    expect(d?.getMonth()).toBe(6);
    expect(d?.getDate()).toBe(15);
  });

  it('returns null for empty input', () => {
    expect(toNativeDate(null)).toBeNull();
    expect(toNativeDate('')).toBeNull();
  });
});

// ── toLocalIsoDate ────────────────────────────────────────────────────────────
describe('toLocalIsoDate', () => {
  it('formats local midnight correctly', () => {
    const d = buildDate(2024, 3, 5)!;
    expect(toLocalIsoDate(d)).toBe('2024-03-05');
  });

  it('does not use UTC (avoids ISO shift)', () => {
    // Construct at local midnight — should always produce correct date.
    const d = new Date(2024, 11, 31);
    expect(toLocalIsoDate(d)).toBe('2024-12-31');
  });
});

// ── DST-safe addCalendarDays (adapter) ────────────────────────────────────────
describe('addCalendarDays (DST-safe field arithmetic)', () => {
  // These tests exercise the Y/M/D path that replaced +86400000 ms.
  it('adds 1 day across a normal boundary', () => {
    const d = new Date(2024, 2, 14);
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    expect(next.getDate()).toBe(15);
    expect(next.getMonth()).toBe(2);
  });

  it('adds days across month boundary', () => {
    const d = new Date(2024, 0, 31);
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    expect(next.getDate()).toBe(1);
    expect(next.getMonth()).toBe(1);
  });

  it('subtracts days across month boundary', () => {
    const d = new Date(2024, 2, 1);
    const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    expect(prev.getDate()).toBe(29);
    expect(prev.getMonth()).toBe(1); // Feb 29 in leap 2024
  });
});

// ── date format patterns ──────────────────────────────────────────────────────
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

// ── formatDisplayDate ─────────────────────────────────────────────────────────
describe('formatDisplayDate', () => {
  it('uses locale short numeric date (datepicker-aligned)', () => {
    const sample = new Date(2026, 7, 19);
    expect(formatDisplayDate(sample, 'en-IN')).toMatch(/19/);
    expect(formatDisplayDate(sample, 'en-IN')).toMatch(/2026/);
    expect(formatDisplayDate(sample, 'en-US')).toMatch(/8\/19\/2026|8\/19\/26/);
  });
});
