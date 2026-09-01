import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PIXEL_ANALYTICS_EXTRA_PROVIDERS,
  PixelAnalyticsService,
  createPixelAnalyticsProviders,
  type PixelAnalyticsConsentState,
} from 'pixel-analytics';
import {
  DOCS_ANALYTICS_LOG_STYLES,
  DocsAnalyticsCaptureStore,
  createDocsCaptureProvider,
} from './docs-analytics-harness';
import { DOCS_ANALYTICS_EVENT_SAMPLES } from './docs-analytics-event-samples';
import DocsAnalyticsLogComponent from './docs-analytics-log.component';

@Component({
  selector: 'docs-analytics-consent-example',
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
      consent: { required: true, defaultState: 'unknown', beforeConsent: 'drop' },
      validateRegistry: false,
      queue: { flushIntervalMs: 60_000 },
    }),
  ],
  template: `
    <div class="docs-analytics-example">
    <p class="hint">
      With <code>consent.required</code>, events drop while state is <code>unknown</code> /
      <code>denied</code>. Grant consent, then track — or revoke to stop collection.
    </p>
    <div class="actions">
      <pixel-button appearance="solid" (click)="setConsent('granted')">Grant</pixel-button>
      <pixel-button appearance="outline" (click)="setConsent('denied')">Deny</pixel-button>
      <pixel-button appearance="outline" (click)="setConsent('unknown')">Reset unknown</pixel-button>
      <pixel-button appearance="tonal" leadingIcon="ads_click" (click)="track()">
        Track event
      </pixel-button>
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <p class="diag">
      consent={{ consent() }} · dropped={{ analytics.diagnostics().eventsDropped }} ·
      queued={{ analytics.diagnostics().eventsQueued }}
    </p>
    <docs-analytics-log [expected]="expected" emptyMessage="Grant consent, then track." />
    </div>
  `,
  styles: [DOCS_ANALYTICS_LOG_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsConsentExample {
  protected readonly analytics = inject(PixelAnalyticsService);
  protected readonly capture = inject(DocsAnalyticsCaptureStore);
  protected readonly consent = signal<PixelAnalyticsConsentState>('unknown');
  protected readonly expected = DOCS_ANALYTICS_EVENT_SAMPLES['analytics-consent'];

  protected setConsent(state: PixelAnalyticsConsentState): void {
    this.consent.set(state);
    this.analytics.setConsent(state);
  }

  protected track(): void {
    this.analytics.track({
      name: 'ui.button.click',
      properties: { action: 'consent-demo' },
    });
  }
}
