import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelPaginatorComponent, type PixelPaginatorSize } from 'pixel-ui';

@Component({
  selector: 'docs-paginator-sizes-example',
  imports: [PixelPaginatorComponent],
  template: `
    <div class="stack">
      @for (size of sizes; track size) {
        <pixel-paginator
          [length]="100"
          [pageIndex]="pages[size]()"
          (pageIndexChange)="pages[size].set($event)"
          [pageSize]="10"
          [size]="size"
        />
      }
    </div>
  `,
  styles: `.stack { display: flex; flex-direction: column; gap: 1.25rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorSizesExample {
  protected readonly sizes: readonly PixelPaginatorSize[] = ['xs', 'sm', 'md', 'lg'];
  protected readonly pages = {
    xs: signal(1),
    sm: signal(1),
    md: signal(1),
    lg: signal(1),
  } as const;
}
