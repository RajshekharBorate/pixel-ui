import { describe, expect, it } from 'vitest';
import { resolvePixelAnalyticsConfig } from '../core/analytics.config';
import { sanitizeAnalyticsProperties } from './sanitizer';

const baseConfig = resolvePixelAnalyticsConfig({
  application: { id: 'test-app', environment: 'test' },
});

describe('sanitizeAnalyticsProperties', () => {
  it('blocks sensitive keys', async () => {
    const result = await sanitizeAnalyticsProperties(
      { password: 'secret', action: 'save' },
      baseConfig,
    );

    expect(result.dropped).toBe(false);
    expect(result.value).toEqual({ action: 'save' });
    expect(result.blockedKeys).toContain('password');
  });

  it('masks configured fields', async () => {
    const result = await sanitizeAnalyticsProperties(
      { email: 'user@example.com' },
      baseConfig,
    );

    expect(result.value?.['email']).toBe('us***om');
  });

  it('blocks token-like keys via contains match', async () => {
    const result = await sanitizeAnalyticsProperties(
      { accessToken: 'abc', apiKey: 'k', action: 'ok' },
      baseConfig,
    );
    expect(result.value).toEqual({ action: 'ok' });
    expect(result.blockedKeys).toEqual(expect.arrayContaining(['accessToken', 'apiKey']));
  });

  it('converts Date values to ISO strings', async () => {
    const result = await sanitizeAnalyticsProperties(
      { at: new Date('2026-01-01T00:00:00.000Z') },
      baseConfig,
    );
    expect(result.value?.['at']).toBe('2026-01-01T00:00:00.000Z');
  });
});
