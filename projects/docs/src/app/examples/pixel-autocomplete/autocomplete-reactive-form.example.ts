import { ChangeDetectionStrategy, Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PixelAutocompleteComponent,
  PixelAutocompleteOption,
  PixelAutocompleteValidationMessages,
  PixelButtonComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-reactive-form-example',
  imports: [ReactiveFormsModule, JsonPipe, PixelAutocompleteComponent, PixelButtonComponent],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="onSubmit()">
      <pixel-autocomplete
        label="Country (required)"
        placeholder="Search countries…"
        [options]="countries"
        [required]="true"
        [allowCustomValue]="false"
        formControlName="country"
        [validationMessages]="messages"
        helperText="Select a country from the list."
      />
      <pixel-autocomplete
        label="City"
        placeholder="Search cities…"
        [options]="cities"
        formControlName="city"
        helperText="Optional — free text allowed."
      />
      <div class="actions">
        <pixel-button type="submit" appearance="solid" [disabled]="form.invalid">Submit</pixel-button>
        <pixel-button type="button" appearance="outline" (click)="onReset()">Reset</pixel-button>
      </div>
      @if (submitted) {
        <pre class="output">{{ form.value | json }}</pre>
      }
    </form>
  `,
  styles: `
    .form { display: grid; gap: 1.25rem; max-width: 22rem; }
    .actions { display: flex; gap: 0.75rem; }
    .output {
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: var(--pixel-sys-surface-container-low);
      font-size: 0.8125rem;
      margin: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteReactiveFormExample {
  protected submitted = false;

  protected readonly form = new FormGroup({
    country: new FormControl<unknown | null>(null, Validators.required),
    city: new FormControl<unknown | null>(null),
  });

  protected readonly messages: PixelAutocompleteValidationMessages = {
    required: 'Please select a country.',
  };

  protected readonly countries: readonly PixelAutocompleteOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'in', label: 'India' },
    { value: 'jp', label: 'Japan' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
  ];

  protected readonly cities: readonly PixelAutocompleteOption[] = [
    { value: 'nyc', label: 'New York' },
    { value: 'lon', label: 'London' },
    { value: 'ber', label: 'Berlin' },
    { value: 'par', label: 'Paris' },
    { value: 'mum', label: 'Mumbai' },
    { value: 'tok', label: 'Tokyo' },
    { value: 'tor', label: 'Toronto' },
    { value: 'syd', label: 'Sydney' },
  ];

  protected onSubmit(): void {
    if (this.form.valid) this.submitted = true;
  }

  protected onReset(): void {
    this.form.reset();
    this.submitted = false;
  }
}
