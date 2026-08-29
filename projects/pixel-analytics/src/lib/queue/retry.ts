import type { ResolvedPixelAnalyticsConfig } from '../core/analytics.config';
import { sleep } from '../core/analytics.utils';

export class PixelAnalyticsHttpStatusError extends Error {
  constructor(
    readonly status: number,
    message?: string,
  ) {
    super(message ?? `HTTP ${status}`);
    this.name = 'PixelAnalyticsHttpStatusError';
  }
}

/** Retry network / 429 / 5xx. Do not retry other 4xx. */
export function isRetryableAnalyticsError(error: unknown): boolean {
  if (error instanceof PixelAnalyticsHttpStatusError) {
    const status = error.status;
    if (status === 429 || status >= 500) {
      return true;
    }
    if (status >= 400 && status < 500) {
      return false;
    }
  }
  // HttpErrorResponse-like
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status: number }).status);
    if (status === 429 || status >= 500) {
      return true;
    }
    if (status >= 400 && status < 500) {
      return false;
    }
    if (status === 0) {
      return true; // network
    }
  }
  return true;
}

export async function withAnalyticsRetry<T>(
  task: () => Promise<T>,
  config: ResolvedPixelAnalyticsConfig,
  onRetry?: () => void,
): Promise<T> {
  const maxAttempts = config.retry.enabled ? config.retry.maxAttempts : 1;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (!isRetryableAnalyticsError(error) || attempt >= maxAttempts) {
        break;
      }
      onRetry?.();
      const jitter = Math.floor(Math.random() * 100);
      const delay = config.retry.baseDelayMs * 2 ** (attempt - 1) + jitter;
      await sleep(delay);
    }
  }

  throw lastError;
}
