import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelPaginatorComponent, type PixelPageEvent } from 'pixel-ui';

@Component({
  selector: 'docs-paginator-basic-example',
  imports: [PixelPaginatorComponent],
  template: `
    <pixel-paginator
      [length]="total"
      [(pageIndex)]="page"
      [(pageSize)]="size"
      (page)="onPage($event)"
    />
    <p class="info">Page {{ page() + 1 }} · {{ size() }} per page · {{ total }} items</p>
  `,
  styles: `.info { margin-block-start: 0.75rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorBasicExample {
  protected readonly total = 100;
  protected readonly page  = signal(0);
  protected readonly size  = signal(10);

  protected onPage(event: PixelPageEvent): void {
    console.log('Page event:', event);
  }
}
