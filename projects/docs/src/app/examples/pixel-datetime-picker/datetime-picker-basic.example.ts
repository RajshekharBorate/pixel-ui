import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDatetimePickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datetime-picker-basic-example',
  imports: [PixelDatetimePickerComponent],
  template: `
    <pixel-datetime-picker
      dateLabel="Appointment date"
      timeLabel="Appointment time"
      timeZoneLabel="Appointment timezone"
      [value]="scheduledAt()"
      (valueChange)="scheduledAt.set($event)"
    />
    <p class="output">UTC payload: <strong>{{ scheduledAt() || '—' }}</strong></p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
      max-width: 52rem;
    }

    .output {
      margin: 0;
      font-size: 0.875rem;
      color: var(--pixel-sys-outline, #74777f);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimePickerBasicExample {
  protected readonly scheduledAt = signal<string | null>(null);
}
