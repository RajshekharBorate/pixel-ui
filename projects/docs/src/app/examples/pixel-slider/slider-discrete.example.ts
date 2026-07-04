import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSliderComponent } from 'pixel-ui';

const RATINGS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

@Component({
  selector: 'docs-slider-discrete-example',
  imports: [PixelSliderComponent],
  template: `
    <pixel-slider
      label="Rating"
      [min]="1"
      [max]="5"
      [step]="1"
      [discrete]="true"
      [showValue]="true"
      [displayWith]="formatRating"
      [(value)]="rating"
    />
    <pixel-slider
      label="Zoom"
      [min]="25"
      [max]="200"
      [step]="25"
      [discrete]="true"
      [showValue]="true"
      [displayWith]="formatZoom"
      [(value)]="zoom"
    />
  `,
  styles: `:host { display: flex; flex-direction: column; gap: 2rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderDiscreteExample {
  protected readonly rating = signal<number>(3);
  protected readonly zoom   = signal<number>(100);

  protected readonly formatRating = (v: number) => RATINGS[v - 1] ?? String(v);
  protected readonly formatZoom   = (v: number) => `${v}%`;
}
