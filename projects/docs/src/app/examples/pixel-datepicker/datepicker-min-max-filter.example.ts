import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  nativeDateAdapterProviders,
  PixelDatepickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-min-max-filter-example',
  standalone: true,
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <pixel-datepicker
      label="Shift date"
      [min]="today"
      [max]="maxDate"
      [dateFilter]="weekdaysOnly"
      helperText="Weekdays only, within the next 30 days."
    />
  `,
  styles: `
    :host {
      display: block;
      max-width: 20rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerMinMaxFilterExample {
  protected readonly today = new Date();
  protected readonly maxDate = new Date(Date.now() + 30 * 86_400_000);

  protected readonly weekdaysOnly = (date: Date): boolean => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };
}
