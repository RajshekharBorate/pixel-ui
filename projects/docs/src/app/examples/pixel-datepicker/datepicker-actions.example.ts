import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  nativeDateAdapterProviders,
  PixelDatepickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-actions-example',
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <pixel-datepicker
      label="Appointment"
      showActions
      helperText="Pick a day, then Apply — Cancel restores the previous value."
      [value]="value()"
      (valueChange)="value.set($event)"
    />
    <p class="value">Committed: {{ displayValue() }}</p>
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
export class DatepickerActionsExample {
  protected readonly value = signal<Date | null>(null);

  protected displayValue(): string {
    const date = this.value();
    return date ? date.toDateString() : '—';
  }
}
