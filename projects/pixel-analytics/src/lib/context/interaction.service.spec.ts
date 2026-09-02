import { describe, expect, it } from 'vitest';
import { PixelAnalyticsInteractionService } from './interaction.service';

describe('PixelAnalyticsInteractionService', () => {
  it('shares traceId across events in one interaction', () => {
    const service = new PixelAnalyticsInteractionService();
    const handle = service.begin('export-menu');
    const first = handle.correlationForEvent();
    const second = handle.correlationForEvent();
    expect(first.traceId).toBe(handle.traceId);
    expect(second.traceId).toBe(handle.traceId);
    expect(first.spanId).not.toBe(second.spanId);
    expect(second.parentSpanId).toBe(first.spanId);
    handle.end();
    expect(service.correlationForNextEvent()).toBeUndefined();
  });

  it('supports nested interactions with the same traceId', () => {
    const service = new PixelAnalyticsInteractionService();
    const outer = service.begin('outer');
    const inner = service.begin('inner');
    expect(inner.traceId).toBe(outer.traceId);
    inner.end();
    outer.end();
  });

  it('runInInteraction cleans up the stack', () => {
    const service = new PixelAnalyticsInteractionService();
    service.runInInteraction('demo', () => {
      expect(service.correlationForNextEvent()?.interactionId).toBe('demo');
    });
    expect(service.correlationForNextEvent()).toBeUndefined();
  });
});
