import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  nativeDateAdapterProviders,
  PixelCheckboxComponent,
  PixelQueryBuilderComponent,
  PixelQueryGroup,
} from 'pixel-ui';
import { createDocsSampleQuery, docsQueryBuilderConfig } from './query-builder-shared';

@Component({
  selector: 'docs-query-builder-disabled-readonly-example',
  imports: [PixelQueryBuilderComponent, PixelCheckboxComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './query-builder-disabled-readonly.example.html',
  styleUrl: './query-builder-disabled-readonly.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderDisabledReadonlyExample {
  protected readonly config = docsQueryBuilderConfig;
  protected readonly query = signal<PixelQueryGroup>(createDocsSampleQuery());
  protected readonly disabled = signal(false);
  protected readonly readOnly = signal(false);
}
