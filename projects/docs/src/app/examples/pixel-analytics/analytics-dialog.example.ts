import { JsonPipe } from '@angular/common';
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

@Component({
  selector: 'docs-analytics-dialog-example',
  imports: [PixelButtonComponent, PixelDialogComponent, JsonPipe],
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
    <div class="log" aria-live="polite">
      @if (capture.events().length === 0) {
        <p class="log__empty">Open and close the dialog.</p>
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
export class AnalyticsDialogExample {
  protected readonly open = signal(false);
  protected readonly capture = inject(DocsAnalyticsCaptureStore);
}
