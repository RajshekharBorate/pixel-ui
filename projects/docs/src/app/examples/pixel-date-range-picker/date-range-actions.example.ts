import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelDateRangePickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-actions-example',
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <pixel-date-range-picker
      label="Travel window"
      showActions
      helperText="Select start and end, then Apply. Cancel discards the draft."
      [formGroup]="form"
      (rangeChange)="onRange($event)"
    />
    <p class="value">Committed: {{ summary() }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
      max-width: 22rem;
    }

    .value {
      margin: 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeActionsExample {
  protected readonly form = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  protected readonly summary = signal('—');

  protected onRange(range: { start: Date | null; end: Date | null }): void {
    if (!range.start || !range.end) {
      this.summary.set('—');
      return;
    }
    this.summary.set(`${range.start.toDateString()} → ${range.end.toDateString()}`);
  }
}
