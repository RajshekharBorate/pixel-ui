import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-reactive-form-example',
  imports: [ReactiveFormsModule, PixelCheckboxComponent],
  template: `
    <pixel-checkbox
      label="I accept the terms"
      helperText="Required before submitting."
      requiredErrorMessage="Please accept the terms to continue."
      required
      [formControl]="termsControl"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxReactiveFormExample {
  protected readonly termsControl = new FormControl(false, {
    nonNullable: true,
    validators: Validators.requiredTrue,
  });
}
