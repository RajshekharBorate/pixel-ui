import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  provideNativeDateAdapter,
  providePixelDateRangeSelectionStrategy,
  PixelDateRangePickerComponent,
  PixelFiveDayRangeSelectionStrategy,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-custom-strategy-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  providers: [
    ...provideNativeDateAdapter(),
    ...providePixelDateRangeSelectionStrategy(PixelFiveDayRangeSelectionStrategy),
  ],
  template: `
    <pixel-date-range-picker
      label="Five-day window"
      [formGroup]="form"
      [selectionStrategy]="fiveDayStrategy"
      helperText="Selecting a start date locks a five-day range."
    />
  `,
  styles: `
    :host {
      display: block;
      max-width: 22rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeCustomStrategyExample {
  protected readonly fiveDayStrategy = inject(PixelFiveDayRangeSelectionStrategy);

  protected readonly form = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
