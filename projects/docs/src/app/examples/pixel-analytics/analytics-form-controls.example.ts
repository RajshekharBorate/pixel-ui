import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PIXEL_UI_ANALYTICS,
  PixelButtonComponent,
  PixelCheckboxComponent,
  PixelRadioGroupComponent,
  PixelSelectComponent,
  PixelToggleComponent,
} from 'pixel-ui';
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
import { DOCS_ANALYTICS_EVENT_SAMPLES } from './docs-analytics-event-samples';
import DocsAnalyticsLogComponent from './docs-analytics-log.component';

@Component({
  selector: 'docs-analytics-form-controls-example',
  imports: [
    PixelButtonComponent,
    PixelCheckboxComponent,
    PixelRadioGroupComponent,
    PixelSelectComponent,
    PixelToggleComponent,
    DocsAnalyticsLogComponent,
  ],
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
    <div class="docs-analytics-example">
    <p class="hint">
      Wave 1 form hooks: select / checkbox / radio / toggle emit when
      <code>PIXEL_UI_ANALYTICS</code> is provided. Option labels and raw values stay out of the
      payload (except radio when <code>analyticsEmitValue</code> is set).
    </p>
    <div class="actions">
      <pixel-select
        analyticsId="status"
        label="Status"
        [options]="[
          { value: 'open', label: 'Open' },
          { value: 'closed', label: 'Closed' },
        ]"
      />
      <pixel-checkbox analyticsId="terms" label="Accept terms" />
      <pixel-radio-group
        analyticsId="priority"
        label="Priority"
        [options]="[
          { value: 'low', label: 'Low' },
          { value: 'high', label: 'High' },
        ]"
      />
      <pixel-toggle analyticsId="alerts" label="Alerts" />
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <docs-analytics-log [expected]="expected" emptyMessage="Interact with the controls." />
    </div>
  `,
  styles: [
    DOCS_ANALYTICS_LOG_STYLES,
    `
      .actions {
        display: grid;
        gap: 1rem;
        margin-block-end: 0.75rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsFormControlsExample {
  protected readonly capture = inject(DocsAnalyticsCaptureStore);
  protected readonly expected = DOCS_ANALYTICS_EVENT_SAMPLES['analytics-form-controls'];
}
