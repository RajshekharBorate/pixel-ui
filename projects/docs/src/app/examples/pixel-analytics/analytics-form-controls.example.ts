import { JsonPipe } from '@angular/common';
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

@Component({
  selector: 'docs-analytics-form-controls-example',
  imports: [
    PixelButtonComponent,
    PixelCheckboxComponent,
    PixelRadioGroupComponent,
    PixelSelectComponent,
    PixelToggleComponent,
    JsonPipe,
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
    <div class="log" aria-live="polite">
      @if (capture.events().length === 0) {
        <p class="log__empty">Interact with the controls.</p>
      } @else {
        @for (event of capture.events(); track event.id) {
          <pre class="log__item">{{ event.name }} {{ event.properties | json }}</pre>
        }
      }
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
}
