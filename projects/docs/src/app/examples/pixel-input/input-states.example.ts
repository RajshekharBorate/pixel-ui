import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelInputComponent, PixelInputValidationMessages } from 'pixel-ui';

@Component({
  selector: 'docs-input-states-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelInputComponent],
  template: `
    <div class="grid">
      <pixel-input
        label="Default"
        value="Plain value"
        helperText="No form control; neutral styling."
      />
      <pixel-input
        label="Disabled"
        value="Locked"
        [disabled]="true"
        helperText="Native disabled via [disabled]."
      />
      <pixel-input
        label="Read only"
        value="Selectable copy"
        [readonly]="true"
        helperText="Native readonly via [readonly]."
      />
      <pixel-input
        label="Loading (editable)"
        value="Saving…"
        [loading]="true"
        helperText="Spinner only; input stays enabled."
      />
      <pixel-input
        label="Loading (blocked)"
        value="Saving…"
        [loading]="true"
        [disabledWhileLoading]="true"
        helperText="Field is disabled while loading."
      />
      <pixel-input
        label="Validation error"
        helperText="Hints stay neutral; errors use validationMessages."
        [validationMessages]="errorMessages"
        [formControl]="errorControl"
      />
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      max-width: 36rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputStatesExample {
  protected readonly errorControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected readonly errorMessages: PixelInputValidationMessages = {
    required: 'This field is required.',
  };
}
