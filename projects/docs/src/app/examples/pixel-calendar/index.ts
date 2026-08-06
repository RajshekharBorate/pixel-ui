import { createDocExample } from '../../shared/example-source.util';
import { CalendarBasicExample } from './calendar-basic.example';

export const CALENDAR_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Single date',
    category: 'Setup',
    description:
      'Standalone month grid used by datepicker / date-range-picker. Bind selected and listen for selectedChange.',
    component: CalendarBasicExample,
    imports: ['PixelCalendarComponent'],
    html: `<pixel-calendar [selected]="selected()" (daySelected)="selected.set($event)" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCalendarComponent } from 'pixel-ui';

@Component({ /* … */ })
export class CalendarBasicExample {
  protected readonly selected = signal<Date | null>(new Date());
}`,
  }),
];
