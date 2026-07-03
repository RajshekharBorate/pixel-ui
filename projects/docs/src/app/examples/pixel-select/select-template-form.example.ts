import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { PixelSelectComponent, PixelSelectOption, PixelSelectValidationMessages } from 'pixel-ui';

@Component({
  selector: 'docs-select-template-form-example',
  standalone: true,
  imports: [FormsModule, PixelSelectComponent],
  template: `
    <form class="stack" #tplForm="ngForm" (ngSubmit)="onSubmit(tplForm)">
      <pixel-select
        label="Country (required)"
        name="country"
        required
        [(ngModel)]="country"
        [options]="countries"
        helperText="Clear to test required + validationMessages after the panel closes."
        [validationMessages]="countryMessages"
      />
      <pixel-select
        label="Tags (required multi)"
        name="tags"
        mode="multiple"
        required
        [(ngModel)]="tags"
        [options]="countries"
        [showSelectAll]="true"
        [showTags]="true"
        helperText="Clear all to test required."
        [validationMessages]="tagsMessages"
      />
      <pixel-select
        label="Region (disabled field)"
        name="region"
        [(ngModel)]="regionLocked"
        [disabled]="true"
        [options]="countries"
        helperText="Uses [disabled] on the field."
      />
      <p class="meta">Form valid: {{ tplForm.valid }}</p>
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
export class SelectTemplateFormExample {
  protected country: unknown | null = 3;
  protected tags: unknown[] = [2, 3];
  protected regionLocked: unknown | null = 1;
  protected readonly serverLoading = signal(false);

  protected readonly countryMessages: PixelSelectValidationMessages = {
    required: 'Pick a country.',
  };

  protected readonly tagsMessages: PixelSelectValidationMessages = {
    required: 'Select at least one tag.',
  };

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];

  protected onSubmit(form: NgForm): void {
    if (form.invalid) {
      return;
    }
  }
}
