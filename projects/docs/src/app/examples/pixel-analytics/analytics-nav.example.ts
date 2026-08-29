import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PIXEL_UI_ANALYTICS,
  PixelButtonComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
  PixelPaginatorComponent,
  PixelTabComponent,
  PixelTabsComponent,
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
  selector: 'docs-analytics-nav-example',
  imports: [
    PixelButtonComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
    PixelPaginatorComponent,
    PixelTabsComponent,
    PixelTabComponent,
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
      Wave 2 navigation hooks: tabs / menu / paginator emit when
      <code>PIXEL_UI_ANALYTICS</code> is provided. Labels stay out of the payload.
    </p>
    <div class="actions">
      <pixel-tabs analyticsId="detail">
        <pixel-tab label="Overview" analyticsId="overview">Overview panel</pixel-tab>
        <pixel-tab label="History" analyticsId="history">History panel</pixel-tab>
      </pixel-tabs>
      <pixel-button [pixelMenuTriggerFor]="actions">Actions</pixel-button>
      <pixel-menu #actions analyticsId="row-actions">
        <pixel-menu-item analyticsAction="export" icon="download">Export</pixel-menu-item>
        <pixel-menu-item analyticsAction="archive" icon="archive">Archive</pixel-menu-item>
      </pixel-menu>
      <pixel-paginator analyticsId="list" [length]="80" [pageSize]="10" />
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <pre class="log">{{ capture.events() | json }}</pre>
  `,
  styles: [DOCS_ANALYTICS_LOG_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsNavExample {
  readonly capture = inject(DocsAnalyticsCaptureStore);
}
