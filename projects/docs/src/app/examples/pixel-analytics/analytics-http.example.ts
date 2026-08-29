import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PIXEL_ANALYTICS_EXTRA_PROVIDERS,
  PixelAnalyticsService,
  createPixelAnalyticsProviders,
} from 'pixel-analytics';
import {
  DOCS_ANALYTICS_LOG_STYLES,
  DocsAnalyticsCaptureStore,
  createDocsCaptureProvider,
} from './docs-analytics-harness';

/**
 * Docs note: `provideHttpClient(withInterceptors([pixelAnalyticsHttpInterceptor]))` and
 * `withHttpTracking()` are environment providers — register them at app/bootstrap (or route)
 * level. This example emits the same event shapes the interceptor would produce.
 */
@Component({
  selector: 'docs-analytics-http-example',
  imports: [PixelButtonComponent, JsonPipe],
  providers: [
    DocsAnalyticsCaptureStore,
    {
      provide: PIXEL_ANALYTICS_EXTRA_PROVIDERS,
      useFactory: (store: DocsAnalyticsCaptureStore) => [createDocsCaptureProvider(store)],
      deps: [DocsAnalyticsCaptureStore],
    },
    ...createPixelAnalyticsProviders({
      application: { id: 'docs-demo', environment: 'docs' },
      consent: { required: false },
      validateRegistry: false,
      queue: { flushIntervalMs: 60_000 },
    }),
  ],
  template: `
    <p class="hint">
      In apps, register <code>pixelAnalyticsHttpInterceptor</code> with
      <code>provideHttpClient(withInterceptors([…]))</code> and
      <code>withHttpTracking()</code> at bootstrap. Defaults skip bodies/headers; the analytics
      ingest URL is always excluded. Below, emit the same <code>api.request</code> /
      <code>api.error</code> shapes the interceptor produces.
    </p>
    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="cloud" (click)="emitSuccess()">
        Simulate api.request
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="cloud_off" (click)="emitError()">
        Simulate api.error
      </pixel-button>
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <div class="log" aria-live="polite">
      @if (capture.events().length === 0) {
        <p class="log__empty">No API events yet.</p>
      } @else {
        @for (event of capture.events(); track event.id) {
          <pre class="log__item">{{ event.name }} {{ event.properties | json }}</pre>
        }
      }
    </div>
  `,
  styles: [DOCS_ANALYTICS_LOG_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsHttpExample {
  private readonly analytics = inject(PixelAnalyticsService);
  protected readonly capture = inject(DocsAnalyticsCaptureStore);

  protected emitSuccess(): void {
    this.analytics.track({
      name: 'api.request',
      category: 'application',
      properties: {
        method: 'GET',
        path: '/api/claims',
        durationMs: 118,
        status: 200,
        ok: true,
      },
    });
  }

  protected emitError(): void {
    this.analytics.track({
      name: 'api.error',
      category: 'application',
      properties: {
        method: 'GET',
        path: '/api/docs-analytics-missing-endpoint',
        durationMs: 42,
        status: 404,
        statusText: 'Not Found',
      },
    });
  }
}
