import { ChangeDetectionStrategy, Component } from '@angular/core';
import { nativeDateAdapterProviders, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-start-views-example',
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <div class="grid">
      <pixel-datepicker
        label="Default (day view)"
        helperText="Click the month/year label in the header."
      />
      <pixel-datepicker
        label="Opens on month view"
        startView="month"
        helperText="Handy for picking within a year."
      />
      <pixel-datepicker
        label="Opens on year view"
        startView="year"
        helperText="Great for birth dates."
      />
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
export class DatepickerStartViewsExample {}
