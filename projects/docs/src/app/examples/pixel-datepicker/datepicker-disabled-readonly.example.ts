import { ChangeDetectionStrategy, Component } from '@angular/core';
import { nativeDateAdapterProviders, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-disabled-readonly-example',
  standalone: true,
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <div class="grid">
      <pixel-datepicker label="Disabled" [value]="today" [disabled]="true" />
      <pixel-datepicker label="Readonly" [value]="today" [readonly]="true" />
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
