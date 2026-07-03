import { DocComponentMeta } from '../types';
import { SELECT_EXAMPLES } from '../../examples/pixel-select';

export const DOC_SELECT_META: DocComponentMeta = {
  id: 'pixel-select',
  title: 'Select',
  selector: 'pixel-select',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Configurable standalone select with single and multiple selection, search, infinite scroll, and rich option layout.',
  overview: [
    'pixel-select provides combobox/listbox semantics with signal-based inputs and ControlValueAccessor integration.',
    'Panel search uses pixel-input; select-all uses pixel-checkbox in multi mode.',
    'Trigger typography, focus ring, and form error behavior align with pixel-input.',
  ],
  useCases: [
    'Reusable enterprise filters and form selectors',
    'Large option sets with async search and pagination',
    'Multi-select with chips and selected-count trigger text',
    'Profile or team pickers with avatars and grouped options',
  ],
  themingNotes: [
    'Override --pixel-select-border-focus and --pixel-select-focus-ring for local customization.',
    'Dark mode is supported via prefers-color-scheme: dark and [data-theme="enterprise-dark"].',
    'Panel width follows match-trigger, auto, or custom strategies via panelWidth.',
  ],
  accessibilityNotes: [
    'Combobox/listbox semantics with role="combobox", role="listbox", and role="option".',
    'ARIA states for expanded, selected, required, invalid, and disabled.',
    'Keyboard support for arrow navigation, Enter/Space selection, Escape close, and Backspace tag removal.',
    'Screen-reader label fallback and helper text wiring via aria-describedby.',
  ],
  imports: ['PixelSelectComponent'],
  inputs: [
    { name: 'value', type: 'unknown | unknown[] | null', defaultValue: 'null', description: 'Controlled value; array in multiple mode.' },
    { name: 'options', type: 'readonly PixelSelectOption[]', defaultValue: '[]', description: 'Flat options source.' },
    { name: 'mode', type: "'single' | 'multiple'", defaultValue: "'single'", description: 'Selection mode.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Density and typography scale.' },
    { name: 'label', type: 'string', defaultValue: "''", description: 'Field label text.' },
    { name: 'placeholder', type: 'string', defaultValue: "''", description: 'Trigger placeholder when empty.' },
    { name: 'searchable', type: 'boolean', defaultValue: 'false', description: 'Shows search input in the panel.' },
    { name: 'serverSearch', type: 'boolean', defaultValue: 'false', description: 'Debounced searchChange for remote querying.' },
    { name: 'showTags', type: 'boolean', defaultValue: 'true', description: 'Multi trigger chip display.' },
    { name: 'showSelectedCount', type: 'boolean', defaultValue: 'true', description: 'Multi trigger selected-count text.' },
    { name: 'validationMessages', type: 'PixelSelectValidationMessages', defaultValue: '{}', description: 'Messages when invalid and touched or dirty.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Prevents interaction.' },
    { name: 'compareWith', type: '(a, b) => boolean', defaultValue: 'Object.is', description: 'Equality for object values.' },
  ],
  outputs: [
    { name: 'valueChange', type: 'unknown | unknown[] | null', description: 'Emits the next selected value(s).' },
    { name: 'selectionChange', type: 'PixelSelectSelectionChange', description: 'Rich selection payload with option metadata.' },
    { name: 'searchChange', type: 'string', description: 'Emits debounced search query for serverSearch mode.' },
    { name: 'openChange', type: 'boolean', description: 'Emits when the panel opens or closes.' },
    { name: 'loadMore', type: '{ query: string; selectedCount: number }', description: 'Infinite scroll load-more signal.' },
    { name: 'clearClick', type: 'void', description: 'Fires when the value becomes empty.' },
  ],
  examples: SELECT_EXAMPLES,
};
