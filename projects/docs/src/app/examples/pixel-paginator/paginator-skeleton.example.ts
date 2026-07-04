import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelPaginatorComponent } from 'pixel-ui';

@Component({
  selector: 'docs-paginator-skeleton-example',
  imports: [PixelPaginatorComponent, PixelCheckboxComponent],
  template: `
    <pixel-checkbox
      label="Show skeleton"
      [checked]="skeleton()"
      (checkedChange)="skeleton.set($event)"
    />
    <div class="stack">
      <pixel-paginator [length]="100" [pageIndex]="1" variant="default"  [showSkeleton]="skeleton()" />
      <pixel-paginator [length]="100" [pageIndex]="1" variant="minimal"  [showSkeleton]="skeleton()" />
    </div>
  `,
  styles: `
    .stack { display: flex; flex-direction: column; gap: 1.25rem; margin-block-start: 1rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorSkeletonExample {
  protected readonly skeleton = signal(true);
}
