import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { PixelAnalyticsHttpConfig } from '../core/analytics.config';
import type { PixelAnalyticsEvent } from '../core/analytics.types';
import { isBrowser } from '../core/analytics.utils';
import { PixelAnalyticsHttpStatusError } from '../queue/retry';

export interface PixelAnalyticsBatchPayload {
  readonly schemaVersion: '1';
  readonly sentAt: string;
  readonly events: readonly PixelAnalyticsEvent[];
}

function toSnakeCase(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

function mapKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(mapKeysDeep);
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[toSnakeCase(key)] = mapKeysDeep(child);
    }
    return out;
  }
  return value;
}

export async function postAnalyticsBatch(
  http: HttpClient,
  config: PixelAnalyticsHttpConfig,
  events: readonly PixelAnalyticsEvent[],
  options?: { urgent?: boolean },
): Promise<void> {
  if (events.length === 0) {
    return;
  }

  const payload: PixelAnalyticsBatchPayload = {
    schemaVersion: '1',
    sentAt: new Date().toISOString(),
    events,
  };

  const wirePayload =
    config.propertyKeyCase === 'snake_case'
      ? (mapKeysDeep(payload) as PixelAnalyticsBatchPayload)
      : payload;
  const body = JSON.stringify(wirePayload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  if (options?.urgent && isBrowser()) {
    // Prefer fetch+keepalive so custom headers can be sent; fall back to text/plain beacon.
    if (typeof fetch === 'function') {
      try {
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers,
          body,
          keepalive: true,
          credentials: 'same-origin',
        });
        if (response.ok) {
          return;
        }
        if (response.status >= 400) {
          throw new PixelAnalyticsHttpStatusError(response.status, response.statusText);
        }
      } catch (error) {
        if (error instanceof PixelAnalyticsHttpStatusError) {
          throw error;
        }
        // fall through to beacon / HttpClient
      }
    }

    if (config.useBeaconOnUnload !== false && navigator.sendBeacon) {
      // text/plain avoids CORS preflight on many ingest endpoints (cookie/session auth).
      const blob = new Blob([body], { type: 'text/plain' });
      const sent = navigator.sendBeacon(config.endpoint, blob);
      if (sent) {
        return;
      }
    }
  }

  try {
    await firstValueFrom(
      http.post(config.endpoint, wirePayload, {
        headers,
        responseType: 'json',
      }),
    );
  } catch (error) {
    if (error instanceof HttpErrorResponse) {
      throw new PixelAnalyticsHttpStatusError(error.status, error.message);
    }
    throw error;
  }
}
