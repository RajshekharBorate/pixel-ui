import { ChangeDetectionStrategy, Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelButtonComponent, PixelDatetimePickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datetime-picker-reactive-form-example',
  imports: [ReactiveFormsModule, JsonPipe, PixelDatetimePickerComponent, PixelButtonComponent],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="onSubmit()">
      <pixel-datetime-picker
        formControlName="scheduledAt"
        [required]="true"
        dateLabel="Start date"
        timeLabel="Start time"
        timeZoneLabel="Timezone"
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
    .form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 56rem;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
    }

    .output {
      margin: 0;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: var(--pixel-sys-surface-container-low, #f2f2f6);
      font-size: 0.8125rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimePickerReactiveFormExample {
  protected submitted = false;

  protected readonly form = new FormGroup({
    scheduledAt: new FormControl<string | null>(null, Validators.required),
  });

  protected onSubmit(): void {
    if (this.form.valid) {
      this.submitted = true;
      return;
    }
    this.form.markAllAsTouched();
  }
}
