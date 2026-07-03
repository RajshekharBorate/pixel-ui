import { ChangeDetectionStrategy, Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelButtonComponent, PixelTimepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-timepicker-reactive-form-example',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, PixelTimepickerComponent, PixelButtonComponent],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="onSubmit()">
      <pixel-timepicker
        label="Start time (required)"
        [required]="true"
        formControlName="start"
        [validationMessages]="messages"
        helperText="Pick a start time."
      />
      <pixel-timepicker
        label="End time"
        format="24"
        formControlName="end"
        helperText="Optional end time."
      />
      <div class="actions">
        <pixel-button type="submit" appearance="solid" [disabled]="form.invalid">Save</pixel-button>
        <pixel-button type="button" appearance="outline" (click)="form.reset()">Clear</pixel-button>
      </div>
      @if (submitted) {
        <pre class="output">{{ form.value | json }}</pre>
      }
    </form>
  `,
  styles: `
    .form    { display: flex; flex-direction: column; gap: 1.25rem; max-width: 22rem; }
    .actions { display: flex; gap: 0.75rem; }
    .output  { margin: 0; padding: 0.75rem; border-radius: 0.5rem; background: var(--pixel-sys-surface-container-low); font-size: 0.8125rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimepickerReactiveFormExample {
  protected submitted = false;

  protected readonly form = new FormGroup({
    start: new FormControl<string | null>(null, Validators.required),
    end:   new FormControl<string | null>('17:00'),
  });

  protected readonly messages = { required: 'Start time is required.' };

  protected onSubmit(): void {
    if (this.form.valid) this.submitted = true;
  }
}
