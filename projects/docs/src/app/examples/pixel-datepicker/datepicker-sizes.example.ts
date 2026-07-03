import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  nativeDateAdapterProviders,
  PixelDatepickerComponent,
  type PixelDatepickerSize,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-sizes-example',
  standalone: true,
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <div class="grid">
      @for (size of sizes; track size) {
        <pixel-datepicker [size]="size" [label]="size + ' size'" placeholder="Select a date" />
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      max-width: 20rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerSizesExample {
  protected readonly sizes: readonly PixelDatepickerSize[] = ['xs', 'sm', 'md', 'lg'];
}
