import { DocComponentMeta } from '../types';
import { TIMEPICKER_EXAMPLES } from '../../examples/pixel-timepicker';

export const TIMEPICKER_META: DocComponentMeta = {
  id: 'pixel-timepicker',
  title: 'Timepicker',
  selector: 'pixel-timepicker',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Time picker with a basic scrollable-segment panel or an advanced Material Design M2 clock dial. Value is always a canonical "HH:mm" string.',
  overview: [
    'Uses pixel-input for the trigger field with a clock toggle icon — consistent with the rest of the form-control family.',
    'input variant shows large interactive hour/minute/period segments for quick keyboard or mouse entry.',
    'clock variant renders a circular SVG clock dial: tap or drag the hand to select hour, then auto-advances to minutes.',
    'format="12" shows AM/PM controls; format="24" adds an inner ring for hours 13-23 in the advanced dial.',
    'Implements ControlValueAccessor and Validator for seamless reactive and template-driven form integration.',
  ],
  useCases: [
    'Event scheduling forms (meeting start/end time)',
    'Alarm and reminder settings in mobile-style interfaces',
    'Booking and reservation systems with time slot selection',
    'Admin dashboards requiring accessible, keyboard-friendly time entry',
  ],
  themingNotes: [
    'Panel background and radius are controlled via --pixel-timepicker-* CSS custom properties.',
    'Clock dial accent color inherits --pixel-sys-primary — override with --pixel-timepicker-primary.',
    'Dark mode is handled automatically through prefers-color-scheme and data-theme selectors.',
  ],
  accessibilityNotes: [
    'Trigger field uses role="combobox" with aria-expanded and aria-controls wired to the panel.',
    'Panel uses role="dialog" with aria-label so screen readers announce it as a time picker.',
    'Clock-dial items have role="button" and aria-pressed so the selected value is announced.',
    'Keyboard users can type directly in the segment inputs or navigate with arrow keys.',
  ],
  imports: ['PixelTimepickerComponent'],
  inputs: [
    { name: 'value',           type: 'string',                                defaultValue: "''",        description: 'Canonical "HH:mm" time value. Two-way bindable.' },
    { name: 'variant',         type: "'input' | 'clock'",                     defaultValue: "'input'",   description: 'input = segment panel; clock = circular dial.' },
    { name: 'format',          type: "'12' | '24'",                           defaultValue: "'12'",      description: '12-hour (AM/PM) or 24-hour display.' },
    { name: 'size',            type: "'xs' | 'sm' | 'md' | 'lg'",            defaultValue: "'md'",      description: 'Density scale inherited by the trigger input.' },
    { name: 'label',           type: 'string',                                defaultValue: "''",        description: 'Visible field label.' },
    { name: 'labelPosition',   type: "'top' | 'left' | 'floating' | 'hidden'", defaultValue: "'top'",   description: 'Label layout relative to the field.' },
    { name: 'placeholder',     type: 'string',                                defaultValue: "''",        description: 'Placeholder shown when empty.' },
    { name: 'helperText',      type: 'string',                                defaultValue: "''",        description: 'Hint copy rendered below the field.' },
    { name: 'required',        type: 'boolean',                               defaultValue: 'false',     description: 'Marks the control required for validation.' },
    { name: 'disabled',        type: 'boolean',                               defaultValue: 'false',     description: 'Disables all interaction.' },
    { name: 'openDirection',   type: "'auto' | 'top' | 'bottom'",             defaultValue: "'auto'",   description: 'Preferred panel placement.' },
    { name: 'validationMessages', type: 'PixelTimepickerValidationMessages',  defaultValue: '{}',        description: 'Error messages per Angular validation key.' },
    { name: 'showSkeleton',    type: 'boolean',                               defaultValue: 'false',     description: 'Show skeleton placeholder while loading.' },
  ],
  outputs: [
    { name: 'valueChange', type: 'string',  description: 'Emits the canonical "HH:mm" value on every confirmed change.' },
    { name: 'openChange',  type: 'boolean', description: 'Emits when the panel opens or closes.' },
  ],
  examples: TIMEPICKER_EXAMPLES,
};
