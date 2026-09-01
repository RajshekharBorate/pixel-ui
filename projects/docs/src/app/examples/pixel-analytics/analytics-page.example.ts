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
  selector: 'docs-analytics-page-example',
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
      validateRegistry: false,
      queue: { flushIntervalMs: 60_000 },
    }),
  ],
  template: `
    <div class="docs-analytics-example">
    <p class="hint">
      <code>analytics.page()</code> records <code>navigation.page.view</code>. In apps, prefer
      <code>withRouteTracking()</code> so Angular <code>NavigationEnd</code> emits page + route +
      transition timing automatically.
    </p>
    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="web" (click)="pageView()">
        Emit page view
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="alt_route" (click)="routeChange()">
        Emit route change
      </pixel-button>
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <docs-analytics-log [expected]="expected" emptyMessage="No navigation events." />
    </div>
  `,
  styles: [DOCS_ANALYTICS_LOG_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPageExample {
  private readonly analytics = inject(PixelAnalyticsService);
  protected readonly capture = inject(DocsAnalyticsCaptureStore);
  protected readonly expected = DOCS_ANALYTICS_EVENT_SAMPLES['analytics-page'];

  protected pageView(): void {
    this.analytics.page({
      properties: { demo: 'manual-page' },
    });
  }

  protected routeChange(): void {
    this.analytics.track({
      name: 'navigation.route.change',
      category: 'navigation',
      properties: { path: '/docs/pixel-analytics', durationMs: 42 },
    });
    this.analytics.track({
      name: 'performance.route.transition',
      category: 'performance',
      properties: { path: '/docs/pixel-analytics', durationMs: 42 },
    });
  }
}
