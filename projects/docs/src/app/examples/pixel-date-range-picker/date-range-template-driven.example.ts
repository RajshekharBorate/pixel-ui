import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelDateRangePickerComponent,
} from 'pixel-ui';

/**
 * `pixel-date-range-picker` is not a single-value CVA — it binds a `FormGroup` with
 * `start` / `end` controls. Use that group from a template-driven host when the rest of
 * the form uses `FormsModule` / `ngModel`.
 */
@Component({
  selector: 'docs-date-range-template-driven-example',
  imports: [FormsModule, PixelDateRangePickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <form class="form" #tripForm="ngForm">
      <pixel-date-range-picker
        label="Trip dates"
        [formGroup]="tripDates"
        [required]="true"
        [validationMessages]="{
          required: 'Both start and end dates are required.',
        }"
        (rangeChange)="onRange($event)"
      />
    </form>
    <p class="readout">
      Model:
      <strong>{{ rangeLabel() }}</strong>
    </p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
      max-width: 22rem;
    }

    .form {
      display: grid;
      gap: 1rem;
    }

    .readout {
      margin: 0;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeTemplateDrivenExample {
  protected readonly tripDates = new FormGroup({
    start: new FormControl<Date | null>(null, { validators: [Validators.required] }),
    end: new FormControl<Date | null>(null, { validators: [Validators.required] }),
  });

  protected readonly rangeLabel = signal('— → —');

  protected onRange(range: { start: Date | null; end: Date | null }): void {
    const start = range.start ? range.start.toDateString() : '—';
    const end = range.end ? range.end.toDateString() : '—';
    this.rangeLabel.set(`${start} → ${end}`);
  }
}
