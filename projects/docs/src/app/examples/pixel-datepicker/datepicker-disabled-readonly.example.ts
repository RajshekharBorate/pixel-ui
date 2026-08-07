import { ChangeDetectionStrategy, Component } from '@angular/core';
import { nativeDateAdapterProviders, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-disabled-readonly-example',
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <div class="grid">
      <pixel-datepicker
        label="Completely disabled"
        showFormatHint
        [value]="today"
        [disabled]="true"
      />
      <pixel-datepicker
        label="Popup disabled"
        showFormatHint
        [value]="today"
        pickerDisabled
      />
      <pixel-datepicker
        label="Input disabled"
        showFormatHint
        [value]="today"
        inputDisabled
      />
      <pixel-datepicker label="Readonly (no edits)" [value]="today" [readonly]="true" />
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      max-width: 20rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerDisabledReadonlyExample {
  protected readonly today = new Date();
}
