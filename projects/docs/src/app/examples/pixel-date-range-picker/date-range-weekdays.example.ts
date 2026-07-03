import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelDateRangePickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-weekdays-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <pixel-date-range-picker
      label="Business travel"
      [formGroup]="form"
      [dateFilter]="weekdaysOnly"
      helperText="Weekends are disabled in the calendar."
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
export class DateRangeWeekdaysExample {
  protected readonly form = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  protected readonly weekdaysOnly = (date: Date): boolean => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };
}
