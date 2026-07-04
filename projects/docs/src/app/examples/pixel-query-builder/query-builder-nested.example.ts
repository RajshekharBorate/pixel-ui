import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  createEmptyQuery,
  createQueryGroup,
  createQueryRule,
  nativeDateAdapterProviders,
  PixelQueryBuilderComponent,
  PixelQueryBuilderConfig,
  PixelQueryGroup,
} from 'pixel-ui';

@Component({
  selector: 'docs-query-builder-nested-example',
  imports: [PixelQueryBuilderComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <pixel-query-builder
      [config]="config"
      [(query)]="query"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderNestedExample {
  protected readonly config: PixelQueryBuilderConfig = {
    maxDepth: 3,
    fields: {
      amount: { name: 'Amount', type: 'number', icon: 'payments' },
      stage: {
        name: 'Stage',
        type: 'multiselect',
        icon: 'list',
        options: [
          { name: 'Prospecting', value: 'prospecting' },
          { name: 'Qualification', value: 'qualification' },
          { name: 'Proposal', value: 'proposal' },
        ],
      },
      closeDate: { name: 'Close date', type: 'date', icon: 'calendar_today' },
    },
  };

  protected readonly query = signal<PixelQueryGroup>(createSampleNestedQuery());
}

function createSampleNestedQuery(): PixelQueryGroup {
  const root = createEmptyQuery('and');
  const amountRule = createQueryRule({
    field: 'amount',
    operator: 'gt',
    value: 100_000,
  });
  const stageRule = createQueryRule({
    field: 'stage',
    operator: 'in',
    value: ['prospecting', 'qualification'],
  });
  const dateGroup = createQueryGroup('or', [
    createQueryRule({
      field: 'closeDate',
      operator: 'between',
      value: ['2024-01-01', '2024-12-31'],
    }),
  ]);

  return {
    ...root,
    rules: [amountRule, stageRule, dateGroup],
  };
}
