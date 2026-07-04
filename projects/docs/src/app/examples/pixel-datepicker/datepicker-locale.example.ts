import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  provideNativeDateAdapter,
  PixelDatepickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-locale-example',
  imports: [PixelDatepickerComponent],
  providers: [...provideNativeDateAdapter({ locale: 'en-GB' })],
  template: `
    <pixel-datepicker
      label="Date of birth"
      locale="en-GB"
      [firstDayOfWeek]="1"
      startView="year"
      [displayWith]="longFormatter"
      helperText="en-GB locale, Monday week start, year-first navigation."
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
export class DatepickerLocaleExample {
  protected readonly longFormatter = (date: Date): string =>
    new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(date);
}
