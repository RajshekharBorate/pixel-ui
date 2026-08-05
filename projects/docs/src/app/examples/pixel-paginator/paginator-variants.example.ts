import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelPaginatorComponent, type PixelPaginatorVariant } from 'pixel-ui';

@Component({
  selector: 'docs-paginator-variants-example',
  imports: [PixelPaginatorComponent],
  template: `
    <div class="stack">
      @for (v of variants; track v) {
        <div class="row">
          <span class="label">{{ v }}</span>
          <pixel-paginator
            [length]="200"
            [pageIndex]="pages[v]()"
            (pageIndexChange)="pages[v].set($event)"
            [pageSize]="10"
            [variant]="v"
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
export class PaginatorVariantsExample {
  protected readonly variants: readonly PixelPaginatorVariant[] = ['default', 'minimal'];
  protected readonly pages = {
    default: signal(2),
    minimal: signal(2),
  } as const;
}
