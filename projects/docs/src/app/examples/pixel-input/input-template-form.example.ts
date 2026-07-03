import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { PixelInputComponent, PixelInputValidationMessages } from 'pixel-ui';

@Component({
  selector: 'docs-input-template-form-example',
  standalone: true,
  imports: [FormsModule, PixelInputComponent],
  template: `
    <form class="stack" #profileForm="ngForm" (ngSubmit)="onSubmit(profileForm)">
      <pixel-input
        label="Email"
        name="email"
        [(ngModel)]="email"
        type="email"
        required
        email
        helperText="We only use this for sign-in."
        [validationMessages]="emailMessages"
      />
      <pixel-input
        label="Username"
        name="username"
        [(ngModel)]="username"
        required
        minlength="3"
        pattern="^[a-zA-Z0-9_]+$"
        helperText="Letters, numbers, underscore; min 3 characters."
        [validationMessages]="usernameMessages"
      />
      <pixel-input
        label="Password"
        name="password"
        [(ngModel)]="password"
        type="password"
        required
        minlength="8"
        [showPasswordToggle]="true"
        helperText="At least 8 characters."
        [validationMessages]="passwordMessages"
      />
      <pixel-input
        label="Notes"
        name="notes"
        [(ngModel)]="notes"
        [maxLength]="120"
        maxlength="120"
        [loading]="notesLoading()"
        helperText="Counter + max length validator."
        [validationMessages]="notesMessages"
      />
      <pixel-input
        label="Disabled (template)"
        name="locked"
        [(ngModel)]="lockedValue"
        [disabled]="true"
        helperText="Uses [disabled] on the field."
      />
      <p class="meta">Form valid: {{ profileForm.valid }}</p>
    </form>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 22rem;
    }

    .meta {
      margin: 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputTemplateFormExample {
  protected email = '';
  protected username = '';
  protected password = '';
  protected notes = '';
  protected lockedValue = 'Cannot edit this';
  protected readonly notesLoading = signal(false);

  protected readonly emailMessages: PixelInputValidationMessages = {
    required: 'Work email is required.',
    email: 'Enter a valid email address.',
  };

  protected readonly usernameMessages: PixelInputValidationMessages = {
    required: 'Choose a username.',
    minlength: 'Use at least {requiredLength} characters.',
    pattern: 'Use only letters, numbers, and underscores.',
  };

  protected readonly passwordMessages: PixelInputValidationMessages = {
    required: 'Password is required.',
    minlength: 'Use at least {requiredLength} characters.',
  };

  protected readonly notesMessages: PixelInputValidationMessages = {
    maxlength: 'Stay within {requiredLength} characters.',
  };

  protected onSubmit(form: NgForm): void {
    if (form.invalid) {
      return;
    }
  }
}
