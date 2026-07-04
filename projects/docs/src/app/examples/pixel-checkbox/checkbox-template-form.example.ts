import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-template-form-example',
  imports: [FormsModule, PixelCheckboxComponent],
  template: `
    <form class="stack" #templateForm="ngForm" (submit)="$event.preventDefault()">
      <pixel-checkbox
        name="templateTerms"
        label="I accept the template form terms"
        helperText="Uses ngModel with the same ControlValueAccessor."
        requiredErrorMessage="Template terms are required."
        required
        [(ngModel)]="templateAccepted"
      />
      <p class="meta">Template model: {{ templateAccepted ? 'accepted' : 'not accepted' }}</p>
      <p class="meta">Form valid: {{ templateForm.valid }}</p>
    </form>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 0.5rem;
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
export class CheckboxTemplateFormExample {
  protected templateAccepted = false;
}
