import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelInputComponent, PixelInputValidationMessages } from 'pixel-ui';

@Component({
  selector: 'docs-input-reactive-form-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelInputComponent],
  template: `
    <pixel-input
      label="Work email"
      type="email"
      helperText="Errors appear when the control is touched or dirty."
      [formControl]="emailControl"
      [validationMessages]="emailMessages"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputReactiveFormExample {
  protected readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  protected readonly emailMessages: PixelInputValidationMessages = {
    required: 'Work email is required.',
    email: 'Enter a valid email address.',
  };
}
