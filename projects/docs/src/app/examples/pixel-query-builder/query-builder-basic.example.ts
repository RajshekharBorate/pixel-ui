import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  createEmptyQuery,
  nativeDateAdapterProviders,
  PixelQueryBuilderComponent,
  PixelQueryBuilderConfig,
  PixelQueryGroup,
} from 'pixel-ui';

@Component({
  selector: 'docs-query-builder-basic-example',
  standalone: true,
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
export class QueryBuilderBasicExample {
  protected readonly config: PixelQueryBuilderConfig = {
    maxDepth: 2,
    fields: {
      name: { name: 'Name', type: 'string', icon: 'badge' },
      age: { name: 'Age', type: 'number', icon: 'numbers' },
      active: { name: 'Active', type: 'boolean', icon: 'toggle_on' },
    },
  };

  protected readonly query = signal<PixelQueryGroup>(createEmptyQuery('and'));
}
