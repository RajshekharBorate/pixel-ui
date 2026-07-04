import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelTimepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-timepicker-states-example',
  imports: [PixelTimepickerComponent],
  template: `
    <pixel-timepicker label="Default"  value="09:00" helperText="Interactive." />
    <pixel-timepicker label="Disabled" value="09:00" [disabled]="true" helperText="Cannot be changed." />
  `,
  styles: `:host { display: flex; flex-direction: column; gap: 1.25rem; max-width: 22rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimepickerStatesExample {}
