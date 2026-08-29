import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PIXEL_UI_ANALYTICS, PixelButtonComponent } from 'pixel-ui';
import {
  PIXEL_ANALYTICS_EXTRA_PROVIDERS,
  PixelAnalyticsService,
  createPixelAnalyticsProviders,
  createPixelUiAnalyticsPort,
} from 'pixel-analytics';
import {
  DOCS_ANALYTICS_LOG_STYLES,
  DocsAnalyticsCaptureStore,
  createDocsCaptureProvider,
} from './docs-analytics-harness';

@Component({
  selector: 'docs-analytics-button-bridge-example',
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
    {
      provide: PIXEL_UI_ANALYTICS,
      useFactory: (analytics: PixelAnalyticsService) => createPixelUiAnalyticsPort(analytics),
      deps: [PixelAnalyticsService],
    },
  ],
  template: `
    <p class="hint">
      Bridge <code>PIXEL_UI_ANALYTICS</code> → <code>PixelAnalyticsService</code>, then set
      <code>analyticsAction</code> on <code>pixel-button</code>.
    </p>
    <div class="actions">
      <pixel-button
        appearance="solid"
        leadingIcon="save"
        analyticsAction="save"
        [analyticsProperties]="{ feature: 'claims' }"
      >
        Save claim
      </pixel-button>
      <pixel-button appearance="outline" analyticsAction="cancel">Cancel</pixel-button>
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <div class="log" aria-live="polite">
      @if (capture.events().length === 0) {
        <p class="log__empty">Activate a button with analyticsAction.</p>
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
export class AnalyticsButtonBridgeExample {
  protected readonly capture = inject(DocsAnalyticsCaptureStore);
}
