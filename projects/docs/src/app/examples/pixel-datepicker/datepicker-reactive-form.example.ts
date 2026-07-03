import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelButtonComponent,
  PixelDatepickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-reactive-form-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelDatepickerComponent, PixelButtonComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="submit()">
      <pixel-datepicker
        formControlName="startDate"
        label="Start date"
        [required]="true"
        [validationMessages]="{ required: 'Start date is required.' }"
      />
      <pixel-button appearance="solid" buttonType="submit">Submit</pixel-button>
    </form>
    @if (submitted()) {
      <p class="result">{{ submitted() }}</p>
    }
  `,
  styles: `
    .form {
      display: grid;
      gap: 1rem;
      max-width: 20rem;
    }

    .result {
      margin: 0;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerReactiveFormExample {
  protected readonly form = new FormGroup({
    startDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
  });

  protected readonly submitted = signal('');

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitted.set('Form is invalid — a start date is required.');
      return;
    }
    const value = this.form.controls.startDate.value;
    this.submitted.set(`Submitted: ${value ? value.toDateString() : '—'}`);
  }
}
