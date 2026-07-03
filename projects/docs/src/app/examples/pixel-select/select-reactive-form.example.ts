import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PixelSelectComponent,
  PixelSelectOption,
  PixelSelectValidationMessages,
} from 'pixel-ui';

@Component({
  selector: 'docs-select-reactive-form-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelSelectComponent],
  template: `
    <pixel-select
      label="Country (required)"
      [options]="countries"
      [required]="true"
      helperText="Clear the value to test required validation after the panel closes."
      [formControl]="countryControl"
      [validationMessages]="validationMessages"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectReactiveFormExample {
  protected readonly countryControl = new FormControl<unknown | null>(3, {
    validators: [Validators.required],
  });

  protected readonly validationMessages: PixelSelectValidationMessages = {
    required: 'Pick a country.',
  };

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];
}
