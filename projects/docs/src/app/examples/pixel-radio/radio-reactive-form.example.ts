import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelRadioGroupComponent } from 'pixel-ui';

@Component({
  selector: 'docs-radio-reactive-form-example',
  imports: [ReactiveFormsModule, PixelRadioGroupComponent],
  template: `
    <pixel-radio-group
      label="Shipping speed"
      helperText="Required before submit."
      [formControl]="shippingControl"
      [options]="shippingOptions"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioReactiveFormExample {
  protected readonly shippingControl = new FormControl<string | null>(null, Validators.required);

  protected readonly shippingOptions = [
    { value: 'standard', label: 'Standard (5–7 days)' },
    { value: 'express', label: 'Express (2 days)' },
  ] as const;
}
