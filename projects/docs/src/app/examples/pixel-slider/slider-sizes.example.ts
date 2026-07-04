import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSliderComponent, type PixelSliderSize } from 'pixel-ui';

@Component({
  selector: 'docs-slider-sizes-example',
  imports: [PixelSliderComponent],
  template: `
    @for (size of sizes; track size) {
      <pixel-slider
        [label]="size.toUpperCase()"
        [size]="size"
        [min]="0"
        [max]="100"
        [value]="50"
      />
    }
  `,
  styles: `:host { display: flex; flex-direction: column; gap: 1.5rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderSizesExample {
  protected readonly sizes: readonly PixelSliderSize[] = ['xs', 'sm', 'md', 'lg'];
}
