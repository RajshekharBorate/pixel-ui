import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSliderComponent } from 'pixel-ui';

@Component({
  selector: 'docs-slider-basic-example',
  standalone: true,
  imports: [PixelSliderComponent],
  template: `
    <pixel-slider
      label="Volume"
      [min]="0"
      [max]="100"
      [step]="1"
      helperText="Drag or use arrow keys to adjust."
      [(value)]="volume"
    />
    <p class="output">Value: <strong>{{ volume() }}</strong></p>
  `,
  styles: `.output { margin-block-start: 0.75rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderBasicExample {
  protected readonly volume = signal<number>(40);
}
