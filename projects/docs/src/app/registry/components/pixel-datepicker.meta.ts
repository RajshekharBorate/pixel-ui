import { DATEPICKER_EXAMPLES } from '../../examples/pixel-datepicker';
import { DocComponentMeta } from '../types';

export const DATEPICKER_META: DocComponentMeta = {
  id: 'pixel-datepicker',
  title: 'Datepicker',
  selector: 'pixel-datepicker',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Accessible date field with pop-over calendar, reactive forms support, and pluggable date adapter.',
  overview: [
    'Composed pixel-input field shell with an inline calendar overlay.',
    'Implements ControlValueAccessor and Validator for reactive and template-driven forms.',
    'Requires nativeDateAdapterProviders() or provideNativeDateAdapter() at app or component scope.',
  ],
  useCases: [
    'Single-date selection in forms and filters',
    'Booking and scheduling with min/max constraints',
    'Locale-aware formatting with custom displayWith',
    'Weekday-only or custom dateFilter predicates',
  ],
  themingNotes: [
    'Field styling inherits from pixel-input tokens and shared form control sizes.',
    'Day cell highlights via dateClass for custom markers (paydays, weekends).',
    'Calendar panel uses the same overlay positioning model as pixel-select.',
  ],
  accessibilityNotes: [
    'Semantic input with label, helper text, and validation messages.',
    'Keyboard navigation inside day/month/year grids.',
    'Arrow keys move focus; Enter/Space selects; Escape closes and returns focus.',
  ],
  imports: ['PixelDatepickerComponent', 'nativeDateAdapterProviders', 'provideNativeDateAdapter'],
  inputs: [
    { name: 'value', type: 'Date | string | number | null', defaultValue: 'null', description: 'Controlled value when not using Angular forms.' },
    { name: 'label', type: 'string', defaultValue: "''", description: 'Field label.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Field size scale.' },
    { name: 'labelPosition', type: "'top' | 'left' | 'floating' | 'hidden'", defaultValue: "'top'", description: 'Label layout.' },
    { name: 'required', type: 'boolean', defaultValue: 'false', description: 'Marks the field as required.' },
    { name: 'min', type: 'PixelDatepickerValue', defaultValue: 'null', description: 'Earliest selectable date.' },
    { name: 'max', type: 'PixelDatepickerValue', defaultValue: 'null', description: 'Latest selectable date.' },
    { name: 'locale', type: 'string', description: 'BCP-47 locale for formatting and parsing.' },
    { name: 'firstDayOfWeek', type: 'number', defaultValue: '0', description: '0 = Sunday … 6 = Saturday.' },
    { name: 'startView', type: "'day' | 'month' | 'year'", defaultValue: "'day'", description: 'Initial calendar grid when opened.' },
    { name: 'startAt', type: 'PixelDatepickerValue', defaultValue: 'null', description: 'Month shown when opening with no value.' },
    { name: 'dateFilter', type: '(date: Date) => boolean', defaultValue: 'null', description: 'Return false to disable a date.' },
    { name: 'dateClass', type: '(date: Date) => string | string[]', defaultValue: 'null', description: 'CSS classes for day cells.' },
    { name: 'displayWith', type: '(date, locale?) => string', description: 'Formats the committed value in the field.' },
    { name: 'validationMessages', type: 'PixelDatepickerValidationMessages', defaultValue: '{}', description: 'Error copy keyed by validator.' },
  ],
  outputs: [
    { name: 'valueChange', type: 'Date | null', description: 'Emits when the committed value changes.' },
    { name: 'openChange', type: 'boolean', description: 'Emits when the calendar panel opens or closes.' },
  ],
  examples: DATEPICKER_EXAMPLES,
};
