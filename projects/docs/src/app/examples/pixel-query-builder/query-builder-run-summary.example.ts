import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  exportQuery,
  isQueryValid,
  nativeDateAdapterProviders,
  queryToSummary,
  PixelButtonComponent,
  PixelQueryBuilderComponent,
  PixelQueryGroup,
  PixelQueryRunEvent,
  PixelQuerySummaryMode,
} from 'pixel-ui';
import { createDocsSampleQuery, docsQueryBuilderConfig } from './query-builder-shared';

@Component({
  selector: 'docs-query-builder-run-summary-example',
  imports: [JsonPipe, PixelButtonComponent, PixelQueryBuilderComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './query-builder-run-summary.example.html',
  styleUrl: './query-builder-run-summary.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderRunSummaryExample {
  protected readonly config = docsQueryBuilderConfig;
  protected readonly query = signal<PixelQueryGroup>(createDocsSampleQuery());
  protected summaryMode: PixelQuerySummaryMode = 'advanced';
  protected readonly lastRun = signal<PixelQueryRunEvent | null>(null);
  protected readonly queryValid = computed(() => isQueryValid(this.query(), this.config));

  protected onRunQuery(): void {
    const query = this.query();
    if (!isQueryValid(query, this.config)) {
      return;
    }
    this.lastRun.set({
      query,
      export: exportQuery(query),
      summary: queryToSummary(query, this.config),
    });
  }
}
