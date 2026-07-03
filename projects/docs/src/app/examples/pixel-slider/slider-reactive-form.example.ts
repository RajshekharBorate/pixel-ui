import { ChangeDetectionStrategy, Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelButtonComponent, PixelSliderComponent } from 'pixel-ui';

@Component({
  selector: 'docs-slider-reactive-form-example',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, PixelSliderComponent, PixelButtonComponent],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="onSubmit()">
      <pixel-slider
        label="Brightness (required)"
        [min]="0"
        [max]="100"
        [showValue]="true"
        [alwaysShowValue]="true"
        formControlName="brightness"
        [validationMessages]="messages"
        helperText="Must be between 10 and 100."
      />
      <pixel-slider
        label="Contrast"
        mode="range"
        [min]="0"
        [max]="100"
        formControlName="contrast"
        helperText="Low – high contrast range."
      />
      <div class="actions">
        <pixel-button type="submit" appearance="solid" [disabled]="form.invalid">Apply</pixel-button>
        <pixel-button type="button" appearance="outline" (click)="form.reset(defaults)">Reset</pixel-button>
      </div>
      @if (submitted) {
        <pre class="output">{{ form.value | json }}</pre>
      }
    </form>
  `,
  styles: `
    .form    { display: flex; flex-direction: column; gap: 1.5rem; max-width: 28rem; }
    .actions { display: flex; gap: 0.75rem; }
    .output  { margin: 0; padding: 0.75rem; border-radius: 0.5rem; background: var(--pixel-sys-surface-container-low); font-size: 0.8125rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderReactiveFormExample {
  protected submitted = false;

  protected readonly defaults = { brightness: 60, contrast: [20, 80] as [number, number] };

  protected readonly form = new FormGroup({
    brightness: new FormControl<number>(60, [Validators.required, Validators.min(10), Validators.max(100)]),
    contrast:   new FormControl<number | [number, number]>([20, 80]),
  });

  protected readonly messages = {
    required: 'Brightness is required.',
    min:      'Minimum value is 10.',
    max:      'Maximum value is 100.',
  };

  protected onSubmit(): void {
    if (this.form.valid) this.submitted = true;
  }
}
