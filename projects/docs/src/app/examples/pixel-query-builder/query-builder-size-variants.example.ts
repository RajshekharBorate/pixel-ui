import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  nativeDateAdapterProviders,
  PixelQueryBuilderComponent,
  PixelQueryBuilderSize,
  PixelQueryGroup,
  PixelSelectComponent,
  type PixelSelectOption,
} from 'pixel-ui';
import { createDocsSampleQuery, docsQueryBuilderConfig } from './query-builder-shared';

@Component({
  selector: 'docs-query-builder-size-variants-example',
  standalone: true,
  imports: [PixelQueryBuilderComponent, PixelSelectComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './query-builder-size-variants.example.html',
  styleUrl: './query-builder-size-variants.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderSizeVariantsExample {
  protected readonly config = docsQueryBuilderConfig;
  protected readonly query = signal<PixelQueryGroup>(createDocsSampleQuery());
  protected readonly builderSize = signal<PixelQueryBuilderSize>('md');

  protected readonly sizes: readonly PixelQueryBuilderSize[] = ['xs', 'sm', 'md', 'lg'];

  protected readonly sizeOptions: readonly PixelSelectOption[] = this.sizes.map(s => ({
    value: s,
    label: s.toUpperCase(),
  }));
}
