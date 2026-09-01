import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PIXEL_UI_ANALYTICS, PixelButtonComponent } from 'pixel-ui';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui/data-grid';
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

interface ClaimRow {
  id: number;
  status: string;
  amount: number;
}

@Component({
  selector: 'docs-analytics-data-grid-example',
  imports: [PixelButtonComponent, PixelDataGridComponent, DocsAnalyticsLogComponent],
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
      Sort, filter, or export to emit <code>data.table.sort</code>,
      <code>data.table.filter</code>, and <code>data.export</code>. Filter payloads never include
      raw values.
    </p>
    <div class="actions">
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <pixel-data-grid
      analyticsId="docs-claims-grid"
      [data]="rows()"
      [columns]="columns"
      [rowId]="rowId"
      exportable
      exportFileName="claims-demo"
    />
    <docs-analytics-log [expected]="expected" emptyMessage="Interact with the grid." />
    </div>
  `,
  styles: [
    DOCS_ANALYTICS_LOG_STYLES,
    `
      pixel-data-grid {
        display: block;
        margin-block-end: 0.75rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDataGridExample {
  protected readonly capture = inject(DocsAnalyticsCaptureStore);
  protected readonly expected = DOCS_ANALYTICS_EVENT_SAMPLES['analytics-data-grid'];
  protected readonly rows = signal<ClaimRow[]>([
    { id: 1, status: 'Open', amount: 1200 },
    { id: 2, status: 'Paid', amount: 880 },
    { id: 3, status: 'Open', amount: 450 },
  ]);
  protected readonly rowId = (row: ClaimRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<ClaimRow>[] = [
    { field: 'id', header: 'ID', sortable: true },
    {
      field: 'status',
      header: 'Status',
      sortable: true,
      filter: {
        type: 'select',
        options: [
          { value: 'Open', label: 'Open' },
          { value: 'Paid', label: 'Paid' },
        ],
      },
    },
    { field: 'amount', header: 'Amount', type: 'number', sortable: true, filter: { type: 'number' } },
  ];
}
