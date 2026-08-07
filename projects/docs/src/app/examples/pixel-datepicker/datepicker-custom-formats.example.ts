import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PIXEL_DD_MM_YYYY_FORMATS,
  provideNativeDateAdapter,
  PixelDatepickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-custom-formats-example',
  imports: [PixelDatepickerComponent],
  providers: [
    ...provideNativeDateAdapter({
      locale: 'en-GB',
      formats: PIXEL_DD_MM_YYYY_FORMATS,
    }),
  ],
  template: `
    <pixel-datepicker
      label="Invoice date"
      showFormatHint
      [value]="value()"
      (valueChange)="value.set($event)"
    />
    <p class="value">Selected: {{ displayValue() }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
      max-width: 20rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerCustomFormatsExample {
  protected readonly value = signal<Date | null>(new Date(2024, 5, 15));

  protected displayValue(): string {
    const date = this.value();
    return date ? date.toDateString() : '—';
  }
}
