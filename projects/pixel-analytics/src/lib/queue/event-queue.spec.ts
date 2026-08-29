import { describe, expect, it } from 'vitest';
import { resolvePixelAnalyticsConfig } from '../core/analytics.config';
import { PIXEL_ANALYTICS_SCHEMA_VERSION } from '../core/analytics.types';
import { PixelAnalyticsEventQueue } from './event-queue';
import { splitAnalyticsBatch } from './batcher';

describe('PixelAnalyticsEventQueue', () => {
  const config = resolvePixelAnalyticsConfig({
    application: { id: 'app', environment: 'test' },
    consent: { pendingQueueLimit: 2 },
    queue: { maxSize: 3 },
  });

  const event = (id: string) => ({
    id,
    name: 'ui.button.click',
    category: 'interaction' as const,
    timestamp: new Date().toISOString(),
    schemaVersion: PIXEL_ANALYTICS_SCHEMA_VERSION,
    application: { id: 'app', environment: 'test' },
    identity: { anonymousId: 'a', sessionId: 's' },
    context: {},
  });

  it('drains queued events in batches', () => {
    const queue = new PixelAnalyticsEventQueue(config);
    queue.enqueue(event('1'), false);
    expect(queue.size()).toBe(1);
    const drained = queue.drain(10);
    expect(drained).toHaveLength(1);
    expect(queue.size()).toBe(0);
    const batches = splitAnalyticsBatch(drained, config);
    expect(batches).toHaveLength(1);
  });

  it('enforces pendingQueueLimit on pending enqueue', () => {
    const queue = new PixelAnalyticsEventQueue(config);
    expect(queue.enqueue(event('1'), true).overflowed).toBe(false);
    expect(queue.enqueue(event('2'), true).overflowed).toBe(false);
    expect(queue.enqueue(event('3'), true).overflowed).toBe(true);
    expect(queue.pendingSize()).toBe(2);
  });

  it('drops leftover pending events on release beyond the limit', () => {
    const queue = new PixelAnalyticsEventQueue(
      resolvePixelAnalyticsConfig({
        application: { id: 'app', environment: 'test' },
        consent: { pendingQueueLimit: 5 },
        queue: { maxSize: 10 },
      }),
    );
    for (let i = 0; i < 4; i += 1) {
      queue.enqueue(event(String(i)), true);
    }
    const result = queue.releasePending(2);
    expect(result.released).toHaveLength(2);
    expect(result.dropped).toBe(2);
    expect(queue.pendingSize()).toBe(0);
    expect(queue.size()).toBe(2);
  });

  it('requeues failed batches at the front', () => {
    const queue = new PixelAnalyticsEventQueue(config);
    queue.enqueue(event('a'), false);
    queue.enqueue(event('b'), false);
    const drained = queue.drain(1);
    expect(drained[0]?.id).toBe('a');
    queue.requeueFront(drained);
    expect(queue.drain(1)[0]?.id).toBe('a');
  });
});
