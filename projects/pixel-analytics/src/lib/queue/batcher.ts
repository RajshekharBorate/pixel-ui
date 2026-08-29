import type { PixelAnalyticsEvent } from '../core/analytics.types';
import type { ResolvedPixelAnalyticsConfig } from '../core/analytics.config';
import { safeJsonByteLength } from '../core/analytics.utils';

export function splitAnalyticsBatch(
  events: readonly PixelAnalyticsEvent[],
  config: ResolvedPixelAnalyticsConfig,
): PixelAnalyticsEvent[][] {
  const batches: PixelAnalyticsEvent[][] = [];
  let current: PixelAnalyticsEvent[] = [];
  let currentBytes = 2; // []

  for (const event of events) {
    const eventBytes = safeJsonByteLength(event);
    const wouldExceedCount = current.length >= config.queue.batchSize;
    const wouldExceedBytes = currentBytes + eventBytes > config.queue.maxBatchBytes;
    if (current.length > 0 && (wouldExceedCount || wouldExceedBytes)) {
      batches.push(current);
      current = [];
      currentBytes = 2;
    }
    current.push(event);
    currentBytes += eventBytes;
  }

  if (current.length > 0) {
    batches.push(current);
  }

  return batches;
}
