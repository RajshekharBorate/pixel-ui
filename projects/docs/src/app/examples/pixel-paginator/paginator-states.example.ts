import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelPaginatorComponent } from 'pixel-ui';

@Component({
  selector: 'docs-paginator-states-example',
  imports: [PixelPaginatorComponent],
  template: `
    <div class="stack">
      <pixel-paginator [length]="100" [pageIndex]="1" [pageSize]="10" />
      <pixel-paginator [length]="100" [pageIndex]="1" [pageSize]="10" [disabled]="true" />
      <pixel-paginator [length]="100" [pageIndex]="1" [pageSize]="10" [showFirstLastButtons]="false" />
    </div>
  `,
  styles: `.stack { display: flex; flex-direction: column; gap: 1.25rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorStatesExample {}
