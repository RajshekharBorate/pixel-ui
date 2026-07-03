import { ChangeDetectionStrategy, Component } from '@angular/core';
import { nativeDateAdapterProviders, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-start-at-date-class-example',
  standalone: true,
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <div class="grid">
      <pixel-datepicker
        label="Weekdays only"
        [dateFilter]="weekdaysOnly"
        helperText="Weekends are disabled in the calendar and when typing."
        [validationMessages]="{ dateFilter: 'Choose a weekday.' }"
      />
      <pixel-datepicker
        label="Opens on Jan 2020"
        [startAt]="startAt"
        helperText="No value selected — calendar starts at startAt."
      />
      <pixel-datepicker
        label="Payday highlight"
        [dateClass]="paydayDateClass"
        helperText="The 15th of each month gets a custom class."
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
export class DatepickerStartAtDateClassExample {
  protected readonly startAt = new Date(2020, 0, 1);

  protected readonly weekdaysOnly = (date: Date): boolean => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  protected readonly paydayDateClass = (date: Date): string | null =>
    date.getDate() === 15 ? 'demo-payday' : null;
}
