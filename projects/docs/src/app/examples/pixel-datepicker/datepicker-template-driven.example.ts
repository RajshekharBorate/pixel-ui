import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { nativeDateAdapterProviders, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-template-driven-example',
  standalone: true,
  imports: [FormsModule, PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <pixel-datepicker
      name="birthDate"
      label="Birth date"
      [(ngModel)]="birthDate"
      [required]="true"
      [validationMessages]="{ required: 'Birth date is required.' }"
    />
    <p class="readout">
      Model value:
      <strong>{{ birthDate ? birthDate.toDateString() : '—' }}</strong>
    </p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
      max-width: 20rem;
    }

    .readout {
      margin: 0;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerTemplateDrivenExample {
  protected birthDate: Date | null = null;
}
