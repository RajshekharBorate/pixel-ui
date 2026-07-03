import { DATE_RANGE_PICKER_EXAMPLES } from '../../examples/pixel-date-range-picker';
import { DocComponentMeta } from '../types';

export const DATE_RANGE_PICKER_META: DocComponentMeta = {
  id: 'pixel-date-range-picker',
  title: 'Date range picker',
  selector: 'pixel-date-range-picker',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Accessible date range field with pop-over calendar, form group binding, and pluggable selection strategies.',
  overview: [
    'Single pixel-input showing Start date – End date in one composed field.',
    'Requires a parent FormGroup with start and end controls (names configurable).',
    'Requires nativeDateAdapterProviders() or provideNativeDateAdapter() at app or component scope.',
  ],
  useCases: [
    'Hotel stays and booking windows',
    'Report date ranges with min/max constraints',
    'Business-day-only ranges via dateFilter',
    'Custom selection strategies (e.g. fixed five-day windows)',
  ],
  themingNotes: [
    'Shares field shell styling with pixel-datepicker via pixel-input.',
    'Hover preview highlights the in-progress range while selecting the end date.',
    'Provide custom strategies with providePixelDateRangeSelectionStrategy().',
  ],
  accessibilityNotes: [
    'Combined field with label, helper text, and validation messages.',
    'Typed input accepts en-dash separated ranges (e.g. 6/10/2024 – 6/14/2024).',
    'Child control validators (required, min, max) surface once touched or dirty.',
  ],
  imports: [
    'PixelDateRangePickerComponent',
    'nativeDateAdapterProviders',
    'provideNativeDateAdapter',
    'providePixelDateRangeSelectionStrategy',
    'PixelFiveDayRangeSelectionStrategy',
  ],
  inputs: [
    { name: 'formGroup', type: 'FormGroup', description: 'Parent group containing start/end controls.' },
    { name: 'startControlName', type: 'string', defaultValue: "'start'", description: 'Start control name inside the group.' },
    { name: 'endControlName', type: 'string', defaultValue: "'end'", description: 'End control name inside the group.' },
    { name: 'label', type: 'string', defaultValue: "''", description: 'Field label.' },
    { name: 'placeholder', type: 'string', defaultValue: "'Start date – End date'", description: 'Combined field placeholder.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Field size scale.' },
    { name: 'min', type: 'PixelDatepickerValue', defaultValue: 'null', description: 'Earliest selectable date.' },
    { name: 'max', type: 'PixelDatepickerValue', defaultValue: 'null', description: 'Latest selectable date.' },
    { name: 'dateFilter', type: '(date: Date) => boolean', defaultValue: 'null', description: 'Return false to disable a date.' },
    { name: 'selectionStrategy', type: 'PixelDateRangeSelectionStrategy', description: 'Custom range selection behavior.' },
    { name: 'validationMessages', type: 'Record<string, string>', defaultValue: '{}', description: 'Error copy for parse/filter/validators.' },
  ],
  outputs: [
    { name: 'rangeChange', type: 'PixelDateRange', description: 'Emits when the committed range changes.' },
    { name: 'openChange', type: 'boolean', description: 'Emits when the calendar panel opens or closes.' },
  ],
  examples: DATE_RANGE_PICKER_EXAMPLES,
};
