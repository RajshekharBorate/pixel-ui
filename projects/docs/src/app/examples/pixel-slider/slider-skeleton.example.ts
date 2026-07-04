import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelSliderComponent } from 'pixel-ui';

@Component({
  selector: 'docs-slider-skeleton-example',
  imports: [PixelSliderComponent, PixelCheckboxComponent],
  template: `
    <pixel-checkbox label="Show skeleton" [checked]="skeleton()" (checkedChange)="skeleton.set($event)" />
    <div class="stack">
      <pixel-slider label="Single md"  [showSkeleton]="skeleton()" />
      <pixel-slider label="Single sm"  size="sm" [showSkeleton]="skeleton()" />
      <pixel-slider label="Single lg"  size="lg" [showSkeleton]="skeleton()" />
    </div>
  `,
  styles: `.stack { display: flex; flex-direction: column; gap: 1.25rem; margin-block-start: 1rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderSkeletonExample {
  protected readonly skeleton = signal(true);
}
