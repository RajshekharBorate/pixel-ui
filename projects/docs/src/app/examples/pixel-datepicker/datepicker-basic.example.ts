import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  nativeDateAdapterProviders,
  PixelDatepickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-basic-example',
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <pixel-datepicker
      label="Event date"
      [value]="value()"
      (valueChange)="value.set($event)"
      helperText="Register the native date adapter at component or app scope."
    />
    <p class="value">Selected: {{ displayValue() }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
      max-width: 20rem;
    }

    .value {
      margin: 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerBasicExample {
  protected readonly value = signal<Date | null>(new Date());

  protected displayValue(): string {
    const date = this.value();
    return date ? date.toDateString() : '—';
  }
}
