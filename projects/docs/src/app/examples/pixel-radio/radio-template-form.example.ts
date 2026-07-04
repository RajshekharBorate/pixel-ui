import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PixelRadioGroupComponent } from 'pixel-ui';

@Component({
  selector: 'docs-radio-template-form-example',
  imports: [FormsModule, PixelRadioGroupComponent],
  template: `
    <form class="stack" #templateForm="ngForm" (submit)="$event.preventDefault()">
      <pixel-radio-group
        name="priority"
        label="Priority"
        required
        [(ngModel)]="templatePriority"
        [options]="priorityOptions"
      />
      <p class="meta">Template model: {{ templatePriority ?? 'none' }}</p>
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
export class RadioTemplateFormExample {
  protected templatePriority: string | null = null;

  protected readonly priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'high', label: 'High' },
  ];
}
