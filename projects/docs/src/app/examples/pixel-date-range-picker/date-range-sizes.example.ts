import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelDateRangePickerComponent,
  type PixelDatepickerSize,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-sizes-example',
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <div class="grid">
      @for (size of sizes; track size) {
        <pixel-date-range-picker
          [label]="size + ' size'"
          [formGroup]="forms[size]"
          [size]="size"
        />
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      max-width: 22rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeSizesExample {
  protected readonly sizes: readonly PixelDatepickerSize[] = ['xs', 'sm', 'md', 'lg'];

  protected readonly forms = Object.fromEntries(
    this.sizes.map((size) => [
      size,
      new FormGroup({
        start: new FormControl<Date | null>(null),
        end: new FormControl<Date | null>(null),
      }),
    ]),
  ) as Record<PixelDatepickerSize, FormGroup>;
}
