import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelButtonComponent,
  PixelDateRangePickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-basic-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent, PixelButtonComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="submit()">
      <pixel-date-range-picker
        label="Stay dates"
        [formGroup]="form"
        [required]="true"
        [validationMessages]="{
          required: 'Both start and end dates are required.',
        }"
      />
      <pixel-button appearance="solid" buttonType="submit">Apply dates</pixel-button>
    </form>
    @if (result()) {
      <p class="result">{{ result() }}</p>
    }
  `,
  styles: `
    .form {
      display: grid;
      gap: 1rem;
      max-width: 22rem;
    }

    .result {
      margin: 0;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeBasicExample {
  protected readonly form = new FormGroup({
    start: new FormControl<Date | null>(null, { validators: [Validators.required] }),
    end: new FormControl<Date | null>(null, { validators: [Validators.required] }),
  });

  protected readonly result = signal('');

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.result.set('Select both start and end dates.');
      return;
    }
    const start = this.form.controls.start.value;
    const end = this.form.controls.end.value;
    this.result.set(`Stay: ${start?.toDateString() ?? '—'} → ${end?.toDateString() ?? '—'}`);
  }
}
