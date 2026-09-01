import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PIXEL_UI_ANALYTICS, PixelButtonComponent, PixelDialogComponent } from 'pixel-ui';
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
  selector: 'docs-analytics-dialog-example',
  imports: [PixelButtonComponent, PixelDialogComponent, DocsAnalyticsLogComponent],
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
      With the Pixel UI bridge provided, dialog open/close emit <code>ui.modal.open</code> /
      <code>ui.modal.close</code> (optional <code>analyticsId</code>).
    </p>
    <div class="actions">
      <pixel-button appearance="solid" (click)="open.set(true)">Open dialog</pixel-button>
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <pixel-dialog
      [(open)]="open"
      title="Analytics demo"
      analyticsId="docs-analytics-dialog"
      size="sm"
    >
      <p>Close this dialog to emit <code>ui.modal.close</code>.</p>
    </pixel-dialog>
    <docs-analytics-log [expected]="expected" emptyMessage="Open and close the dialog." />
    </div>
  `,
  styles: [DOCS_ANALYTICS_LOG_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDialogExample {
  protected readonly open = signal(false);
  protected readonly capture = inject(DocsAnalyticsCaptureStore);
  protected readonly expected = DOCS_ANALYTICS_EVENT_SAMPLES['analytics-dialog'];
}
