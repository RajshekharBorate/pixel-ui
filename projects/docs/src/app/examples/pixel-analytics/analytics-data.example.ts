import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PIXEL_UI_ANALYTICS,
  PixelButtonComponent,
  PixelDatepickerComponent,
  PixelFileUploadComponent,
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
  selector: 'docs-analytics-data-example',
  imports: [PixelButtonComponent, PixelDatepickerComponent, PixelFileUploadComponent, JsonPipe],
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
      Waves 4–5: datepicker emits <code>hasValue</code> only by default; file upload emits counts
      and buckets — never filenames or ISO dates unless <code>analyticsEmitValue</code>.
    </p>
    <div class="actions">
      <pixel-datepicker analyticsId="due-date" label="Due date" />
      <pixel-file-upload analyticsId="claim-docs" label="Attachments" />
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <pre class="log">{{ capture.events() | json }}</pre>
  `,
  styles: [DOCS_ANALYTICS_LOG_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDataExample {
  readonly capture = inject(DocsAnalyticsCaptureStore);
}
