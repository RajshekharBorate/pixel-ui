import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDatetimePickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datetime-picker-fixed-timezone-example',
  imports: [PixelDatetimePickerComponent],
  template: `
    <pixel-datetime-picker
      dateLabel="Webinar date"
      timeLabel="Webinar time"
      [hideTimeZone]="true"
      defaultTimeZone="America/New_York"
      [value]="scheduledAt()"
      (valueChange)="scheduledAt.set($event)"
    />
    <p class="hint">
      Timezone is fixed to <code>America/New_York</code>; users choose only date and time.
    </p>
    <p class="output">UTC payload: <strong>{{ scheduledAt() || '—' }}</strong></p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
      max-width: 44rem;
    }

    .hint,
    .output {
      margin: 0;
      font-size: 0.875rem;
      color: var(--pixel-sys-outline, #74777f);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimePickerFixedTimezoneExample {
  protected readonly scheduledAt = signal<string | null>(null);
}
