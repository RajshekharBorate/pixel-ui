import { DATETIME_PICKER_EXAMPLES } from '../../examples/pixel-datetime-picker';
import { DocComponentMeta } from '../types';

export const DATETIME_PICKER_META: DocComponentMeta = {
  id: 'pixel-datetime-picker',
  title: 'Datetime Picker',
  selector: 'pixel-datetime-picker',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Composed date + time + timezone picker that emits canonical ISO-8601 UTC instants.',
  overview: [
    'Combines pixel-datepicker, pixel-timepicker, and a timezone select into one CVA control.',
    'Outputs UTC ISO strings suitable for API payloads in scheduling and appointment flows.',
    'Supports fixed-zone mode for business contexts where timezone is policy-driven.',
    'Uses IANA timezone IDs and DST-safe conversion logic through Intl timezone parts.',
  ],
  useCases: [
    'Appointment and meeting creation',
    'Any form field representing a globally meaningful instant',
    'Business workflows where viewer timezone differs from target/customer timezone',
    'Reactive forms with UTC payload storage',
  ],
  themingNotes: [
    'Inherits visual tokens from the internal datepicker/timepicker/select components.',
    'Layout spacing follows --pixel-sys-spacing-* tokens in the component stylesheet.',
  ],
  accessibilityNotes: [
    'Date, time, and timezone controls expose independent labels for clear assistive-tech announcements.',
    'CVA required validation integrates with Angular form error workflows.',
  ],
  imports: ['PixelDatetimePickerComponent', 'PIXEL_COMMON_TIMEZONES', 'PIXEL_TIMEZONE'],
  inputs: [
    { name: 'value', type: 'string | null', defaultValue: 'null', description: 'Controlled UTC ISO value.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Size propagated to all inner fields.' },
    { name: 'labelPosition', type: "'top' | 'left' | 'floating' | 'hidden'", defaultValue: "'top'", description: 'Label layout for inner controls.' },
    { name: 'defaultTimeZone', type: 'string', defaultValue: "''", description: 'Initial IANA timezone when no value is set.' },
    { name: 'timeZoneOptions', type: 'readonly PixelSelectOption[]', defaultValue: 'PIXEL_COMMON_TIMEZONES', description: 'Timezone dropdown options.' },
    { name: 'hideTimeZone', type: 'boolean', defaultValue: 'false', description: 'Hides timezone selector and uses the resolved default zone.' },
    { name: 'timeFormat', type: "'12' | '24' | undefined", defaultValue: 'undefined', description: 'Hour cycle for the time field.' },
    { name: 'locale', type: 'string | undefined', defaultValue: 'undefined', description: 'Locale for time format resolution.' },
    { name: 'required', type: 'boolean', defaultValue: 'false', description: 'Marks control as required.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Disables all interaction.' },
  ],
  outputs: [
    { name: 'valueChange', type: 'string | null', description: 'Emits the UTC ISO value whenever the resolved instant changes.' },
    { name: 'change', type: 'PixelDatetimePickerChangeEvent', description: 'Detailed payload with UTC, local date/time, and selected timezone.' },
  ],
  examples: DATETIME_PICKER_EXAMPLES,
};
