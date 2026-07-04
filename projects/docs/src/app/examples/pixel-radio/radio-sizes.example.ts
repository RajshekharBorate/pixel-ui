import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelRadioGroupComponent, PixelRadioOption, PixelRadioSize } from 'pixel-ui';

@Component({
  selector: 'docs-radio-sizes-example',
  imports: [PixelRadioGroupComponent],
  template: `
    <div class="row">
      @for (size of sizes; track size) {
        <pixel-radio-group
          [size]="size"
          [label]="'Size ' + size"
          [options]="[{ value: size, label: 'Selected ' + size }]"
          [value]="size"
        />
      }
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      align-items: flex-start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioSizesExample {
  protected readonly sizes: readonly PixelRadioSize[] = ['xs', 'sm', 'md', 'lg'];
}
