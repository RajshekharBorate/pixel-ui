import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelDateRangePickerComponent,
  type PixelDatepickerLabelPosition,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-label-positions-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <div class="grid">
      @for (position of labelPositions; track position) {
        <pixel-date-range-picker
          [label]="position + ' label'"
          [formGroup]="forms[position]"
          [labelPosition]="position"
          [ariaLabel]="position === 'hidden' ? 'Date range with hidden label' : ''"
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
export class DateRangeLabelPositionsExample {
  protected readonly labelPositions: readonly PixelDatepickerLabelPosition[] = [
    'top',
    'left',
    'floating',
    'hidden',
  ];

  protected readonly forms = Object.fromEntries(
    this.labelPositions.map((position) => [
      position,
      new FormGroup({
        start: new FormControl<Date | null>(null),
        end: new FormControl<Date | null>(null),
      }),
    ]),
  ) as Record<PixelDatepickerLabelPosition, FormGroup>;
}
