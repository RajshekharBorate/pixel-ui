import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  PIXEL_UI_ANALYTICS,
  PixelButtonComponent,
  PixelDrawerComponent,
  PixelPopoverComponent,
  PixelPopoverTriggerDirective,
  PixelToastContainerComponent,
  PixelToastService,
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
  selector: 'docs-analytics-overlays-example',
  imports: [
    PixelButtonComponent,
    PixelDrawerComponent,
    PixelPopoverComponent,
    PixelPopoverTriggerDirective,
    PixelToastContainerComponent,
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
    <pixel-toast-container />
    <p class="hint">
      Wave 3 overlays: drawer / popover / toast emit when <code>PIXEL_UI_ANALYTICS</code> is
      provided. Titles and messages stay out of the payload.
    </p>
    <div class="actions">
      <pixel-button (click)="drawerOpen.set(true)">Open drawer</pixel-button>
      <pixel-button [pixelPopoverTriggerFor]="tip">Open popover</pixel-button>
      <pixel-popover #tip analyticsId="help-tip">Popover body (not tracked).</pixel-popover>
      <pixel-button (click)="showToast()">Show toast</pixel-button>
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <pixel-drawer analyticsId="filters" [(open)]="drawerOpen" title="Filters">
      Drawer body (title not tracked).
    </pixel-drawer>
    <docs-analytics-log [expected]="expected" emptyMessage="Open drawer, popover, or toast." />
    </div>
  `,
  styles: [DOCS_ANALYTICS_LOG_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsOverlaysExample {
  readonly capture = inject(DocsAnalyticsCaptureStore);
  protected readonly expected = DOCS_ANALYTICS_EVENT_SAMPLES['analytics-overlays'];
  private readonly toast = inject(PixelToastService);
  readonly drawerOpen = signal(false);

  showToast(): void {
    this.toast.show({ type: 'info', title: 'Saved', message: 'Not tracked in analytics.' });
  }
}
