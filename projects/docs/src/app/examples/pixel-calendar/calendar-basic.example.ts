import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCalendarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-calendar-basic-example',
  imports: [PixelCalendarComponent],
  template: `<pixel-calendar [selected]="selected()" (daySelected)="selected.set($event)" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarBasicExample {
  protected readonly selected = signal<Date | null>(new Date(2026, 7, 5));
}
