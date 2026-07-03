import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-disabled-control-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelCheckboxComponent],
  template: `
    <pixel-checkbox
      label="Disabled by form control"
      helperText="Disabled comes from ControlValueAccessor setDisabledState."
      [formControl]="disabledControl"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxDisabledControlExample {
  protected readonly disabledControl = new FormControl({ value: false, disabled: true }, {
    nonNullable: true,
  });
}
