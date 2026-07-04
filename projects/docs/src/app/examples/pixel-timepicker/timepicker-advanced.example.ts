import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTimepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-timepicker-advanced-example',
  imports: [PixelTimepickerComponent],
  template: `
    <div class="grid">
      <pixel-timepicker
        label="Alarm (12-hour)"
        variant="clock"
        format="12"
        helperText="Tap a number or drag the hand."
        [(value)]="alarm12"
      />
      <pixel-timepicker
        label="Reminder (24-hour)"
        variant="clock"
        format="24"
        helperText="24-hour clock with inner ring."
        [(value)]="alarm24"
      />
    </div>
  `,
  styles: `.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1.25rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimepickerAdvancedExample {
  protected readonly alarm12 = signal('07:00');
  protected readonly alarm24 = signal('14:30');
}
