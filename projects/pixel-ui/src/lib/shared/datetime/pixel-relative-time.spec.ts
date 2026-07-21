import {
  formatAbsoluteTimestamp,
  formatRelativeTime,
} from './pixel-relative-time';

describe('formatRelativeTime', () => {
  const now = new Date('2026-07-21T12:00:00Z').getTime();

  it('collapses the first minute to a "now"-style phrase', () => {
    expect(
      formatRelativeTime(now - 15_000, { locale: 'en', now, numeric: 'auto' }),
    ).toMatch(/now/i);
  });

  it('formats minutes, hours, and days with Intl', () => {
    expect(
      formatRelativeTime(now - 5 * 60_000, { locale: 'en', now, numeric: 'always' }),
    ).toBe('5 minutes ago');
    expect(
      formatRelativeTime(now - 60_000, { locale: 'en', now, numeric: 'always' }),
    ).toBe('1 minute ago');
    expect(
      formatRelativeTime(now - 5 * 3_600_000, { locale: 'en', now, numeric: 'always' }),
    ).toBe('5 hours ago');
    expect(
      formatRelativeTime(now - 1 * 3_600_000, { locale: 'en', now, numeric: 'always' }),
    ).toBe('1 hour ago');
    expect(
      formatRelativeTime(now - 2 * 86_400_000, { locale: 'en', now, numeric: 'always' }),
    ).toBe('2 days ago');
  });

  it('falls back to an absolute timestamp after seven days by default', () => {
    const eightDaysAgo = now - 8 * 86_400_000;
    expect(formatRelativeTime(eightDaysAgo, { locale: 'en', now })).toBe(
      formatAbsoluteTimestamp(eightDaysAgo, 'en'),
    );
  });

  it('can keep long-range relative units when absoluteAfterDays is null', () => {
    expect(
      formatRelativeTime(now - 14 * 86_400_000, {
        locale: 'en',
        now,
        numeric: 'always',
        absoluteAfterDays: null,
      }),
    ).toBe('2 weeks ago');
  });

  it('returns an empty string for invalid input', () => {
    expect(formatRelativeTime('not-a-date', { now })).toBe('');
  });
});

describe('formatAbsoluteTimestamp', () => {
  it('formats a locale-aware absolute date and time', () => {
    const text = formatAbsoluteTimestamp('2026-07-21T12:00:00Z', 'en-US');
    expect(text).toMatch(/2026/);
    expect(text.length).toBeGreaterThan(0);
  });
});
