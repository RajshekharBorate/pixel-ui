import { describe, expect, it } from 'vitest';
import { resolvePixelAnalyticsConfig } from '../core/analytics.config';
import { PIXEL_ANALYTICS_SCHEMA_VERSION } from '../core/analytics.types';
import { validateAnalyticsEvent } from './validator';

const config = resolvePixelAnalyticsConfig({
  application: { id: 'app', environment: 'test' },
  validateRegistry: true,
});

const baseEvent = {
  id: '1',
  name: 'ui.button.click',
  category: 'interaction' as const,
  timestamp: new Date().toISOString(),
  schemaVersion: PIXEL_ANALYTICS_SCHEMA_VERSION,
  application: { id: 'app', environment: 'test' },
  identity: { anonymousId: 'anon', sessionId: 'session' },
  context: {},
};

describe('validateAnalyticsEvent', () => {
  it('accepts registered events', () => {
    expect(validateAnalyticsEvent(baseEvent, config).valid).toBe(true);
  });

  it('rejects invalid names', () => {
    const result = validateAnalyticsEvent({ ...baseEvent, name: 'Bad Name' }, config);
    expect(result.valid).toBe(false);
  });

  it('rejects unregistered events when registry validation is enabled', () => {
    const result = validateAnalyticsEvent(
      { ...baseEvent, name: 'custom.product.save' },
      config,
    );
    expect(result.valid).toBe(false);
  });
});
