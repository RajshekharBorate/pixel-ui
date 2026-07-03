import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  nativeDateAdapterProviders,
  PixelDatepickerComponent,
  type PixelDatepickerLabelPosition,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-label-positions-example',
  standalone: true,
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <div class="grid">
      @for (position of labelPositions; track position) {
        <pixel-datepicker
          [labelPosition]="position"
          [label]="position + ' label'"
          ariaLabel="Date with hidden label"
          placeholder="Select a date"
        />
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      max-width: 24rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerLabelPositionsExample {
  protected readonly labelPositions: readonly PixelDatepickerLabelPosition[] = [
    'top',
    'left',
    'floating',
    'hidden',
  ];
}
