import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { PixelAnalyticsEvent } from '../core/analytics.types';
import { PIXEL_ANALYTICS_HTTP_CONFIG } from '../core/analytics.tokens';
import type { PixelAnalyticsProvider } from './analytics-provider';
import { postAnalyticsBatch } from '../transport/http-transport';

@Injectable()
export class PixelAnalyticsHttpProvider implements PixelAnalyticsProvider {
  readonly id = 'http';
  private readonly http = inject(HttpClient);
  private readonly config = inject(PIXEL_ANALYTICS_HTTP_CONFIG);

  async sendBatch(
    events: readonly PixelAnalyticsEvent[],
    options?: { urgent?: boolean },
  ): Promise<void> {
    await postAnalyticsBatch(this.http, this.config, events, options);
  }
}
