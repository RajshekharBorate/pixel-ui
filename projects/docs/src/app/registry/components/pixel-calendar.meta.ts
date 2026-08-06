import { DocComponentMeta } from '../types';
import { CALENDAR_EXAMPLES } from '../../examples/pixel-calendar';

export const CALENDAR_META: DocComponentMeta = {
  id: 'pixel-calendar',
  title: 'Calendar',
  selector: 'pixel-calendar',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Accessible month / year calendar grid for single-date or range selection; building block for datepicker.',
  overview: [
    'pixel-calendar renders a keyboard-navigable day grid with optional adjacent-month fillers.',
    'Supports single and range modes, min/max bounds, dateFilter, and dateClass hooks.',
    'Datepicker and date-range-picker compose this grid inside an overlay.',
  ],
  useCases: [
    'Inline date selection without a text field',
    'Custom picker shells that need only the grid',
    'Range preview while choosing end dates',
  ],
  themingNotes: [
    'Day cells use system surface / primary tokens; override via component host tokens in the calendar SCSS contract.',
  ],
  accessibilityNotes: [
    'Grid uses button semantics for days with arrow-key navigation across the month.',
    'Disabled / filtered dates are non-interactive.',
  ],
  imports: ['PixelCalendarComponent'],
  inputs: [
    { name: 'mode', type: "'single' | 'range'", defaultValue: "'single'", description: 'Selection styling mode.' },
    { name: 'selected', type: 'Date | null', defaultValue: 'null', description: 'Selected date in single mode.' },
    { name: 'rangeStart', type: 'Date | null', defaultValue: 'null', description: 'Range start.' },
    { name: 'rangeEnd', type: 'Date | null', defaultValue: 'null', description: 'Range end.' },
    { name: 'min', type: 'Date | string | number | null', defaultValue: 'null', description: 'Earliest selectable date.' },
    { name: 'max', type: 'Date | string | number | null', defaultValue: 'null', description: 'Latest selectable date.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Disable the whole grid.' },
    { name: 'startView', type: "'day' | 'month' | 'year'", defaultValue: "'day'", description: 'Initial view.' },
  ],
  outputs: [
    { name: 'daySelected', type: 'Date', description: 'Day activated in the grid.' },
    { name: 'dayHover', type: 'Date | null', description: 'Hovered day (range preview).' },
    { name: 'escapePressed', type: 'void', description: 'Escape pressed while focused in the grid.' },
  ],
  examples: CALENDAR_EXAMPLES,
};
