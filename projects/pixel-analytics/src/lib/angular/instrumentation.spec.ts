import { TestBed } from '@angular/core/testing';
import { ErrorHandler } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { Subject } from 'rxjs';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { providePixelAnalytics } from './provide-analytics';
import { withErrorTracking, PixelAnalyticsErrorHandler } from './error-tracking';
import { withHttpTracking, pixelAnalyticsHttpInterceptor } from './http-tracking';
import { withRouteTracking } from './route-tracking';
import { PixelAnalyticsService } from '../core/analytics.service';

describe('Phase 8 instrumentation plugins', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('withErrorTracking', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          providePixelAnalytics({
            application: { id: 'app', environment: 'test' },
            consent: { required: false },
            validateRegistry: false,
            queue: { flushIntervalMs: 60_000 },
          }),
          withErrorTracking(),
        ],
      });
    });

    it('registers PixelAnalyticsErrorHandler as ErrorHandler', () => {
      const handler = TestBed.inject(ErrorHandler);
      expect(handler).toBeInstanceOf(PixelAnalyticsErrorHandler);
    });

    it('tracks application errors without throwing from handleError', () => {
      const analytics = TestBed.inject(PixelAnalyticsService);
      const trackSpy = vi.spyOn(analytics, 'trackError');
      const handler = TestBed.inject(ErrorHandler) as PixelAnalyticsErrorHandler;
      expect(() => handler.handleError(new Error('boom'))).not.toThrow();
      expect(trackSpy).toHaveBeenCalled();
    });
  });

  describe('withHttpTracking', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;
    let analytics: PixelAnalyticsService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptors([pixelAnalyticsHttpInterceptor])),
          provideHttpClientTesting(),
          providePixelAnalytics({
            application: { id: 'app', environment: 'test' },
            http: { endpoint: '/api/analytics/events' },
            consent: { required: false },
            validateRegistry: false,
            queue: { flushIntervalMs: 60_000 },
          }),
          withHttpTracking({ captureSuccess: true, captureErrors: true }),
        ],
      });
      http = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
      analytics = TestBed.inject(PixelAnalyticsService);
    });

    afterEach(() => {
      httpMock.match(() => true).forEach((req) => req.flush({}));
      httpMock.verify();
    });

    it('tracks successful API requests when captureSuccess is enabled', async () => {
      const trackSpy = vi.spyOn(analytics, 'track');
      http.get('/api/claims').subscribe();
      const req = httpMock.expectOne('/api/claims');
      req.flush({ ok: true });
      await new Promise((r) => setTimeout(r, 0));
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'api.request',
          properties: expect.objectContaining({
            method: 'GET',
            status: 200,
          }),
        }),
      );
    });

    it('tracks API errors', async () => {
      const trackSpy = vi.spyOn(analytics, 'track');
      http.get('/api/claims').subscribe({ error: () => undefined });
      const req = httpMock.expectOne('/api/claims');
      req.flush('fail', { status: 500, statusText: 'Server Error' });
      await new Promise((r) => setTimeout(r, 0));
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'api.error',
          properties: expect.objectContaining({
            status: 500,
          }),
        }),
      );
    });

    it('skips the analytics ingest endpoint', async () => {
      const trackSpy = vi.spyOn(analytics, 'track');
      http.post('/api/analytics/events', { events: [] }).subscribe();
      const req = httpMock.expectOne('/api/analytics/events');
      req.flush({});
      await new Promise((r) => setTimeout(r, 0));
      expect(trackSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: 'api.request' }),
      );
    });
  });

  describe('withRouteTracking', () => {
    it('emits page and route events on NavigationEnd', async () => {
      const events$ = new Subject<unknown>();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          providePixelAnalytics({
            application: { id: 'app', environment: 'test' },
            consent: { required: false },
            validateRegistry: false,
            queue: { flushIntervalMs: 60_000 },
          }),
          {
            provide: Router,
            useValue: {
              events: events$.asObservable(),
            },
          },
          withRouteTracking({ trackDuration: true, trackRouteChange: true }),
        ],
      });

      // ENVIRONMENT_INITIALIZER runs on first inject of an env provider consumer.
      const analytics = TestBed.inject(PixelAnalyticsService);
      const pageSpy = vi.spyOn(analytics, 'page');
      const trackSpy = vi.spyOn(analytics, 'track');

      // Force initializers by injecting something that was registered with ENVIRONMENT_INITIALIZER
      // TestBed runs ENVIRONMENT_INITIALIZER when the environment is created.
      events$.next(new NavigationStart(1, '/claims'));
      events$.next(new NavigationEnd(1, '/claims', '/claims'));
      await new Promise((r) => setTimeout(r, 0));

      expect(pageSpy).toHaveBeenCalled();
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'navigation.route.change' }),
      );
    });
  });
});
