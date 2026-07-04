import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSliderComponent, type PixelSliderValue } from 'pixel-ui';

@Component({
  selector: 'docs-slider-range-example',
  imports: [PixelSliderComponent],
  template: `
    <pixel-slider
      label="Price range"
      mode="range"
      [min]="0"
      [max]="1000"
      [step]="10"
      [showValue]="true"
      [displayWith]="formatPrice"
      helperText="Select your budget range."
      [(value)]="priceRange"
    />
    <p class="output">
      Range: <strong>{{ formatPrice(range()[0]) }} – {{ formatPrice(range()[1]) }}</strong>
    </p>
  `,
  styles: `.output { margin-block-start: 0.75rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderRangeExample {
  protected readonly priceRange = signal<PixelSliderValue>([200, 700]);

  protected readonly range = () => this.priceRange() as [number, number];

  protected readonly formatPrice = (v: number) => `$${v}`;
}
