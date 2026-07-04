import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelCheckboxComponent, PixelCheckboxLabelPosition } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-label-positions-example',
  imports: [PixelCheckboxComponent],
  template: `
    <div class="row">
      @for (position of labelPositions; track position) {
        <pixel-checkbox
          [labelPosition]="position"
          [label]="position === 'left' ? 'Label on the left' : 'Label on the right'"
          helperText="The whole row is clickable."
          [checked]="position === 'right'"
        />
      }
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      align-items: flex-start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxLabelPositionsExample {
  protected readonly labelPositions: readonly PixelCheckboxLabelPosition[] = ['left', 'right'];
}
