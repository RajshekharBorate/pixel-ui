import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelPaginatorComponent, type PixelPaginatorButtonShape } from 'pixel-ui';

@Component({
  selector: 'docs-paginator-shapes-example',
  imports: [PixelPaginatorComponent],
  template: `
    <div class="stack">
      @for (shape of shapes; track shape) {
        <div class="row">
          <span class="label">{{ shape }}</span>
          <pixel-paginator
            [length]="100"
            [pageIndex]="pages[shape]()"
            (pageIndexChange)="pages[shape].set($event)"
            [buttonShape]="shape"
          />
        </div>
      }
    </div>
  `,
  styles: `
    .stack { display: flex; flex-direction: column; gap: 1.5rem; }
    .row   { display: flex; flex-direction: column; gap: 0.5rem; }
    .label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em;
             text-transform: uppercase; color: var(--pixel-sys-outline); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorShapesExample {
  protected readonly shapes: readonly PixelPaginatorButtonShape[] = ['rounded', 'circle'];
  protected readonly pages = {
    rounded: signal(2),
    circle: signal(2),
  } as const;
}
