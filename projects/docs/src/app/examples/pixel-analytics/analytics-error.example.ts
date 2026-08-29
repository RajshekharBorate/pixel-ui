import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ErrorHandler, inject } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PIXEL_ANALYTICS_EXTRA_PROVIDERS,
  PIXEL_ANALYTICS_ERROR_OPTIONS,
  PixelAnalyticsErrorHandler,
  PixelAnalyticsService,
  createPixelAnalyticsProviders,
} from 'pixel-analytics';
import {
  DOCS_ANALYTICS_LOG_STYLES,
  DocsAnalyticsCaptureStore,
  createDocsCaptureProvider,
} from './docs-analytics-harness';

@Component({
  selector: 'docs-analytics-error-example',
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
    { provide: PIXEL_ANALYTICS_ERROR_OPTIONS, useValue: { rethrow: false } },
    { provide: ErrorHandler, useClass: PixelAnalyticsErrorHandler },
  ],
  template: `
    <p class="hint">
      Call <code>trackError</code> for handled failures, or throw through
      <code>withErrorTracking()</code> / <code>PixelAnalyticsErrorHandler</code> for unhandled ones
      (this demo sets <code>rethrow: false</code> so the docs shell stays quiet).
    </p>
    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="bug_report" (click)="handled()">
        Track handled error
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="error" (click)="unhandled()">
        Fire unhandled error
      </pixel-button>
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <div class="log" aria-live="polite">
      @if (capture.events().length === 0) {
        <p class="log__empty">No errors recorded.</p>
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
export class AnalyticsErrorExample {
  private readonly analytics = inject(PixelAnalyticsService);
  private readonly errors = inject(ErrorHandler);
  protected readonly capture = inject(DocsAnalyticsCaptureStore);

  protected handled(): void {
    this.analytics.trackError(new Error('Validation failed'), {
      handled: true,
      component: 'docs-analytics-error',
      properties: { code: 'VALIDATION' },
    });
  }

  protected unhandled(): void {
    this.errors.handleError(new Error('Unexpected boom'));
  }
}
