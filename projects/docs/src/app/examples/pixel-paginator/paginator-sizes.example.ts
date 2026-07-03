import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelPaginatorComponent, type PixelPaginatorSize } from 'pixel-ui';

@Component({
  selector: 'docs-paginator-sizes-example',
  standalone: true,
  imports: [PixelPaginatorComponent],
  template: `
    <div class="stack">
      @for (size of sizes; track size) {
        <pixel-paginator [length]="100" [pageIndex]="1" [pageSize]="10" [size]="size" />
      }
    </div>
  `,
  styles: `.stack { display: flex; flex-direction: column; gap: 1.25rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorSizesExample {
  protected readonly sizes: readonly PixelPaginatorSize[] = ['xs', 'sm', 'md', 'lg'];
}
