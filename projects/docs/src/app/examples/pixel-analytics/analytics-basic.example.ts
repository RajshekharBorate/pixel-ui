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
  selector: 'docs-analytics-basic-example',
  imports: [PixelButtonComponent, DocsAnalyticsLogComponent],
  providers: [
    DocsAnalyticsCaptureStore,
    {
      provide: PIXEL_ANALYTICS_EXTRA_PROVIDERS,
      useFactory: (store: DocsAnalyticsCaptureStore) => [createDocsCaptureProvider(store)],
      deps: [DocsAnalyticsCaptureStore],
    },
    ...createPixelAnalyticsProviders({
      application: { id: 'docs-demo', name: 'Pixel Docs', version: '0.0.0', environment: 'docs' },
      consent: { required: true, defaultState: 'granted' },
      validateRegistry: false,
      queue: { flushIntervalMs: 60_000 },
      debug: true,
    }),
  ],
  template: `
    <div class="docs-analytics-example">
    <p class="hint">
      Core API: <code>track</code>, <code>page</code>, <code>identify</code>, <code>setConsent</code>,
      and <code>diagnostics</code>. Events below are captured by a docs-only provider (no network).
    </p>
    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="ads_click" (click)="trackClick()">
        Track click
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="web" (click)="trackPage()">
        Page view
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="person" (click)="identify()">
        Identify
      </pixel-button>
      <pixel-button appearance="text" leadingIcon="delete" (click)="clear()">
        Clear log
      </pixel-button>
    </div>
    <p class="diag">
      diagnostics: created {{ analytics.diagnostics().eventsCreated }}, queued
      {{ analytics.diagnostics().eventsQueued }}, dropped
      {{ analytics.diagnostics().eventsDropped }}
    </p>
    <docs-analytics-log [expected]="expected" emptyMessage="No events yet." />
    </div>
  `,
  styles: [DOCS_ANALYTICS_LOG_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsBasicExample {
  protected readonly analytics = inject(PixelAnalyticsService);
  protected readonly capture = inject(DocsAnalyticsCaptureStore);
  protected readonly expected = DOCS_ANALYTICS_EVENT_SAMPLES['analytics-basic'];

  protected trackClick(): void {
    this.analytics.track({
      name: 'ui.button.click',
      properties: { action: 'demo', feature: 'analytics-basic' },
    });
  }

  protected trackPage(): void {
    this.analytics.page({
      properties: { demo: true },
    });
  }

  protected identify(): void {
    this.analytics.identify({ userId: 'docs-user-42' });
    this.analytics.track({
      name: 'custom.identity.linked',
      properties: { userId: 'docs-user-42' },
    });
  }

  protected clear(): void {
    this.capture.clear();
  }
}
