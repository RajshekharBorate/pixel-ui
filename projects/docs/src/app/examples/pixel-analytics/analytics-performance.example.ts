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
import { DOCS_ANALYTICS_EVENT_SAMPLES } from './docs-analytics-event-samples';
import DocsAnalyticsLogComponent from './docs-analytics-log.component';

@Component({
  selector: 'docs-analytics-performance-example',
  imports: [PixelButtonComponent, DocsAnalyticsLogComponent],
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
      sampling: { performanceRate: 1 },
      validateRegistry: false,
      queue: { flushIntervalMs: 60_000 },
    }),
  ],
  template: `
    <div class="docs-analytics-example">
    <p class="hint">
      Use <code>trackPerformance</code> for custom timings. App-wide page load / Web Vitals come from
      <code>withPerformanceTracking()</code> (sampled via <code>performanceRate</code>).
    </p>
    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="timer" (click)="measure()">
        Measure dashboard load
      </pixel-button>
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <docs-analytics-log [expected]="expected" emptyMessage="No performance events." />
    </div>
  `,
  styles: [DOCS_ANALYTICS_LOG_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPerformanceExample {
  private readonly analytics = inject(PixelAnalyticsService);
  protected readonly capture = inject(DocsAnalyticsCaptureStore);
  protected readonly expected = DOCS_ANALYTICS_EVENT_SAMPLES['analytics-performance'];

  protected measure(): void {
    const started = performance.now();
    // Simulate work
    let total = 0;
    for (let i = 0; i < 50_000; i += 1) {
      total += i;
    }
    void total;
    this.analytics.trackPerformance({
      name: 'dashboard-load',
      durationMs: Math.round(performance.now() - started),
      properties: { route: '/docs/analytics' },
    });
  }
}
