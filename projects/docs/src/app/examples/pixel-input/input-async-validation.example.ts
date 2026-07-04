import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Observable, delay, map, of } from 'rxjs';
import { PixelInputComponent, PixelInputValidationMessages } from 'pixel-ui';

function simulateAsyncHandleValidator(
  delayMs: number,
  reserved: readonly string[],
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const raw = String(control.value ?? '').trim();
    if (raw.length < 2) {
      return of(null);
    }
    return of(raw).pipe(
      delay(delayMs),
      map((handle) =>
        reserved.includes(handle.toLowerCase()) ? { handleTaken: true } : null,
      ),
    );
  };
}

@Component({
  selector: 'docs-input-async-validation-example',
  imports: [ReactiveFormsModule, PixelInputComponent],
  template: `
    <pixel-input
      label="Public handle"
      [formControl]="handleControl"
      autocomplete="nickname"
      helperText="Async check (~0.9s). Try taken, admin, or system — spinner shows while pending."
      [validationMessages]="handleMessages"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputAsyncValidationExample {
  protected readonly handleControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
    asyncValidators: [simulateAsyncHandleValidator(900, ['taken', 'admin', 'system'])],
  });

  protected readonly handleMessages: PixelInputValidationMessages = {
    required: 'Handle is required.',
    minlength: 'Use at least {requiredLength} characters.',
    handleTaken: 'That handle is reserved — try another.',
  };
}
