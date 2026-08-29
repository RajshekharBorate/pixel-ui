import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { PixelAnalyticsService } from './analytics.service';
import { providePixelAnalytics } from '../angular/provide-analytics';
import { PixelAnalyticsHttpProvider } from '../providers/http.provider';
import { PIXEL_ANALYTICS_PROVIDERS, PIXEL_ANALYTICS_RESOLVED_CONFIG } from '../core/analytics.tokens';
import { HttpClient } from '@angular/common/http';
import { PIXEL_ANALYTICS_SCHEMA_VERSION } from '../core/analytics.types';

const analyticsProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
  providePixelAnalytics({
    application: { id: 'app', environment: 'test' },
    http: { endpoint: '/api/analytics/events' },
    consent: { required: false },
    queue: { batchSize: 10, flushIntervalMs: 60_000 },
    validateRegistry: false,
  }),
];

describe('PixelAnalyticsService', () => {
  let service: PixelAnalyticsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: analyticsProviders });
    service = TestBed.inject(PixelAnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(async () => {
    httpMock.match(() => true).forEach((req) => req.flush({}));
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  async function settleTrack(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  it('tracks events without throwing', async () => {
    expect(() =>
      service.track({
        name: 'ui.button.click',
        properties: { action: 'save' },
      }),
    ).not.toThrow();
    await settleTrack();
    expect(service.diagnostics().queueSize).toBe(1);
    httpMock.expectNone('/api/analytics/events');
  });

  it('resolves HTTP config for enterprise transport', () => {
    const resolved = TestBed.inject(PIXEL_ANALYTICS_RESOLVED_CONFIG);
    expect(resolved.http?.endpoint).toBe('/api/analytics/events');
    expect(TestBed.inject(HttpClient)).toBeTruthy();
    const providers = TestBed.inject(PIXEL_ANALYTICS_PROVIDERS);
    expect(providers.some((provider) => provider.id === 'http')).toBe(true);
  });

  it('sends batches through the HTTP provider', async () => {
    const httpProvider = TestBed.inject(PixelAnalyticsHttpProvider);
    const event = {
      id: 'evt-1',
      name: 'ui.button.click',
      category: 'interaction' as const,
      timestamp: new Date().toISOString(),
      schemaVersion: PIXEL_ANALYTICS_SCHEMA_VERSION,
      application: { id: 'app', environment: 'test' },
      identity: { anonymousId: 'anon', sessionId: 'session' },
      context: {},
    };
    const sendPromise = httpProvider.sendBatch([event]);
    const req = httpMock.expectOne('/api/analytics/events');
    req.flush({});
    await sendPromise;
  });

  it('queues events for later HTTP batch flush', async () => {
    service.track({ name: 'ui.button.click', properties: { action: 'save' } });
    await settleTrack();
    expect(service.diagnostics().eventsQueued).toBe(1);
    expect(service.diagnostics().queueSize).toBe(1);
    httpMock.expectNone('/api/analytics/events');
  });
});
