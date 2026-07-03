import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelDateRangePickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-booking-window-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <pixel-date-range-picker
      label="Booking window"
      [formGroup]="form"
      [min]="today"
      [max]="maxBookingDate"
      helperText="Select dates within the next 30 days."
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
export class DateRangeBookingWindowExample {
  protected readonly today = new Date();
  protected readonly maxBookingDate = new Date(Date.now() + 30 * 86_400_000);

  protected readonly form = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
