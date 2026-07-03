import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelToggleComponent } from 'pixel-ui';

@Component({
  selector: 'docs-toggle-reactive-form-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelToggleComponent],
  template: `
    <pixel-toggle
      label="I accept the terms"
      helperText="Required before submitting."
      requiredErrorMessage="Please accept the terms to continue."
      required
      [formControl]="termsControl"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleReactiveFormExample {
  protected readonly termsControl = new FormControl(false, {
    nonNullable: true,
    validators: Validators.requiredTrue,
  });
}
