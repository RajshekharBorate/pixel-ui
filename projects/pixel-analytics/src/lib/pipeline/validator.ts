import type { PixelAnalyticsEvent } from '../core/analytics.types';
import type { ResolvedPixelAnalyticsConfig } from '../core/analytics.config';
import {
  getPixelAnalyticsEventDefinition,
  type PixelAnalyticsRegistry,
} from '../events/event-registry';

export interface PixelAnalyticsValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
}

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*){1,5}$/;

export function validateAnalyticsEvent(
  event: PixelAnalyticsEvent,
  config: ResolvedPixelAnalyticsConfig,
  registry?: PixelAnalyticsRegistry,
): PixelAnalyticsValidationResult {
  if (!event.name.trim()) {
    return { valid: false, reason: 'Event name is required.' };
  }
  if (!EVENT_NAME_PATTERN.test(event.name)) {
    return { valid: false, reason: `Invalid event name: ${event.name}` };
  }
  const definition = getPixelAnalyticsEventDefinition(event.name, registry);
  if (config.validateRegistry && !definition) {
    return { valid: false, reason: `Unregistered event: ${event.name}` };
  }
  if (!event.application.id || !event.application.environment) {
    return { valid: false, reason: 'Application id and environment are required.' };
  }
  if (!event.identity.anonymousId || !event.identity.sessionId) {
    return { valid: false, reason: 'Identity context is incomplete.' };
  }

  if (config.validateRegistry && definition?.properties && event.properties) {
    for (const [key, schema] of Object.entries(definition.properties)) {
      if (schema.required && event.properties[key] === undefined) {
        return { valid: false, reason: `Missing required property: ${key}` };
      }
      const value = event.properties[key];
      if (value === undefined || value === null) {
        continue;
      }
      const actual = typeof value;
      if (actual !== schema.type) {
        return {
          valid: false,
          reason: `Property ${key} expected ${schema.type}, got ${actual}`,
        };
      }
    }
  }

  return { valid: true };
}

/** Stable [0,1) bucket from identity + event name so funnels stay consistent. */
function stableSampleUnit(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

/**
 * @returns true when the event should be dropped due to sampling.
 * Prefer {@link isSampledOut} — this alias is kept for existing call sites.
 */
export function shouldSampleAnalyticsEvent(
  event: Pick<PixelAnalyticsEvent, 'name' | 'category' | 'identity'>,
  config: ResolvedPixelAnalyticsConfig,
): boolean {
  return isSampledOut(event, config);
}

/** @returns true when the event should be dropped due to sampling. */
export function isSampledOut(
  event: Pick<PixelAnalyticsEvent, 'name' | 'category' | 'identity'>,
  config: ResolvedPixelAnalyticsConfig,
): boolean {
  if (config.sampling.bypass.includes(event.name)) {
    return false;
  }
  let rate = config.sampling.defaultRate;
  if (event.category === 'performance') {
    rate = config.sampling.performanceRate;
  } else if (event.category === 'application' && event.name.includes('error')) {
    rate = config.sampling.errorRate;
  }
  if (rate >= 1) {
    return false;
  }
  if (rate <= 0) {
    return true;
  }
  const unit = stableSampleUnit(`${event.identity.anonymousId}:${event.name}`);
  return unit > rate;
}
