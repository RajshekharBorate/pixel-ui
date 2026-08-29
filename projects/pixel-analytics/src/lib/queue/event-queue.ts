import type { PixelAnalyticsEvent } from '../core/analytics.types';
import type { ResolvedPixelAnalyticsConfig } from '../core/analytics.config';

export interface PixelAnalyticsEnqueueResult {
  readonly accepted: boolean;
  /** True when an older event was shifted out due to maxSize / pendingQueueLimit. */
  readonly overflowed: boolean;
}

export interface PixelAnalyticsReleasePendingResult {
  readonly released: readonly PixelAnalyticsEvent[];
  readonly dropped: number;
}

export class PixelAnalyticsEventQueue {
  private readonly items: PixelAnalyticsEvent[] = [];
  private readonly pendingConsent: PixelAnalyticsEvent[] = [];

  constructor(private readonly config: ResolvedPixelAnalyticsConfig) {}

  enqueue(event: PixelAnalyticsEvent, pendingConsent = false): PixelAnalyticsEnqueueResult {
    const target = pendingConsent ? this.pendingConsent : this.items;
    const limit = pendingConsent
      ? this.config.consent.pendingQueueLimit
      : this.config.queue.maxSize;
    let overflowed = false;
    while (target.length >= limit) {
      target.shift();
      overflowed = true;
    }
    target.push(event);
    return { accepted: true, overflowed };
  }

  /**
   * Removes up to `batchSize` events from the front of the main queue.
   * Caller must re-queue on delivery failure for at-least-once semantics.
   */
  drain(batchSize: number): PixelAnalyticsEvent[] {
    const count = Math.min(batchSize, this.items.length);
    return this.items.splice(0, count);
  }

  /** Re-insert events at the front after a failed delivery (capped by maxSize). */
  requeueFront(events: readonly PixelAnalyticsEvent[]): number {
    if (events.length === 0) {
      return 0;
    }
    this.items.unshift(...events);
    let dropped = 0;
    while (this.items.length > this.config.queue.maxSize) {
      this.items.pop();
      dropped += 1;
    }
    return dropped;
  }

  releasePending(limit: number): PixelAnalyticsReleasePendingResult {
    const count = Math.min(limit, this.pendingConsent.length);
    const released = this.pendingConsent.splice(0, count);
    for (const event of released) {
      this.enqueue(event, false);
    }
    const dropped = this.pendingConsent.length;
    this.pendingConsent.length = 0;
    return { released, dropped };
  }

  clearPending(): void {
    this.pendingConsent.length = 0;
  }

  size(): number {
    return this.items.length;
  }

  pendingSize(): number {
    return this.pendingConsent.length;
  }

  clear(): void {
    this.items.length = 0;
    this.pendingConsent.length = 0;
  }
}
