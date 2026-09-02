import { Injectable } from '@angular/core';
import type { PixelAnalyticsCorrelationContext } from '../core/analytics.types';
import { createAnalyticsId } from '../core/analytics.utils';

export interface PixelAnalyticsInteractionHandle {
  readonly interactionId: string;
  readonly traceId: string;
  correlationForEvent(): PixelAnalyticsCorrelationContext;
  end(): void;
}

interface InteractionFrame {
  readonly interactionId: string;
  readonly traceId: string;
  currentSpanId: string;
  readonly depth: number;
}

function newTraceId(): string {
  return createAnalyticsId().replace(/-/g, '').padEnd(32, '0').slice(0, 32);
}

function newSpanId(): string {
  return createAnalyticsId().replace(/-/g, '').padEnd(16, '0').slice(0, 16);
}

/**
 * Stack-based interaction scopes for shared `traceId` across related UI events.
 * Used by Pixel UI menus and available to apps via {@link PixelAnalyticsService.runInInteraction}.
 */
@Injectable()
export class PixelAnalyticsInteractionService {
  private readonly stack: InteractionFrame[] = [];

  begin(name: string): PixelAnalyticsInteractionHandle {
    const parent = this.stack[this.stack.length - 1];
    const traceId = parent?.traceId ?? newTraceId();
    const spanId = newSpanId();
    const interactionId = name.trim() || 'interaction';
    const frame: InteractionFrame = {
      interactionId,
      traceId,
      currentSpanId: spanId,
      depth: this.stack.length,
    };
    this.stack.push(frame);

    const handle: PixelAnalyticsInteractionHandle = {
      interactionId,
      traceId,
      correlationForEvent: () => {
        const correlation = this.correlationForNextEvent();
        if (correlation) {
          return correlation;
        }
        return {
          traceId,
          spanId: newSpanId(),
          interactionId,
        };
      },
      end: () => this.endHandle(handle),
    };
    return handle;
  }

  runInInteraction<T>(name: string, fn: () => T): T {
    const handle = this.begin(name);
    try {
      return fn();
    } finally {
      handle.end();
    }
  }

  /** Merges active interaction correlation with optional explicit overrides. */
  correlationForNextEvent(
    explicit?: Partial<PixelAnalyticsCorrelationContext>,
  ): PixelAnalyticsCorrelationContext | undefined {
    const frame = this.stack[this.stack.length - 1];
    if (!frame && !explicit?.traceId) {
      return explicit as PixelAnalyticsCorrelationContext | undefined;
    }
    const spanId = explicit?.spanId ?? newSpanId();
    if (!frame) {
      return explicit as PixelAnalyticsCorrelationContext | undefined;
    }
    const parentSpanId = explicit?.parentSpanId ?? frame.currentSpanId;
    frame.currentSpanId = spanId;
    return {
      traceId: explicit?.traceId ?? frame.traceId,
      spanId,
      parentSpanId,
      interactionId: explicit?.interactionId ?? frame.interactionId,
      requestId: explicit?.requestId,
    };
  }

  private endHandle(handle: PixelAnalyticsInteractionHandle): void {
    const index = this.stack.findIndex(
      (frame) => frame.traceId === handle.traceId && frame.interactionId === handle.interactionId,
    );
    if (index < 0) {
      return;
    }
    this.stack.splice(index);
  }
}
