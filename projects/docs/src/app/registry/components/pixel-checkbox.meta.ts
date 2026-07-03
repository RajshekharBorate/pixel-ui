import { DocComponentMeta } from '../types';
import { CHECKBOX_EXAMPLES } from '../../examples/pixel-checkbox';

export const DOC_CHECKBOX_META: DocComponentMeta = {
  id: 'pixel-checkbox',
  title: 'Checkbox',
  selector: 'pixel-checkbox',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Standalone checkbox with signal inputs, explicit outputs, indeterminate mixed state, and scoped theme tokens.',
  overview: [
    'pixel-checkbox uses native checkbox semantics with custom styling and ControlValueAccessor integration.',
    'Checked and unchecked derive from checked, ngModel, or FormControl values; state supports indeterminate and loading visuals.',
    'Helper text stays neutral during validation; required errors render as a separate message line.',
  ],
  useCases: [
    'Terms, consent, and acknowledgement fields',
    'Multi-select filters and table row selection',
    'Parent selection with an indeterminate mixed state',
    'Validation states for required form steps',
  ],
  themingNotes: [
    'Override --pixel-checkbox-border, --pixel-checkbox-check, and --pixel-checkbox-focus-ring on the host.',
    'Automatic dark mode uses prefers-color-scheme; force a subtree with data-theme="enterprise-dark".',
    'Disabled and error colors use dedicated semantic tokens for WCAG-friendly contrast.',
  ],
  accessibilityNotes: [
    'Uses a native input type="checkbox" hidden visually but kept accessible.',
    'Supports Tab focus and Space or Enter activation.',
    'Sets aria-checked, aria-disabled, aria-required, and aria-describedby.',
    'Helper text is automatically associated with the native input.',
  ],
  imports: ['PixelCheckboxComponent'],
  inputs: [
    { name: 'label', type: 'string', defaultValue: "''", description: 'Visible label rendered inside the clickable area.' },
    { name: 'checked', type: 'boolean', defaultValue: 'false', description: 'Controlled checked baseline.' },
    { name: 'indeterminate', type: 'boolean', defaultValue: 'false', description: 'Controlled mixed-state baseline.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Prevents all interaction.' },
    { name: 'required', type: 'boolean', defaultValue: 'false', description: 'Adds native and ARIA required semantics.' },
    { name: 'readonly', type: 'boolean', defaultValue: 'false', description: 'Keeps focusable but prevents changes.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Density, box size, and label scale.' },
    { name: 'state', type: "'indeterminate' | 'loading' | undefined", defaultValue: 'undefined', description: 'Non-value visual states.' },
    { name: 'labelPosition', type: "'left' | 'right'", defaultValue: "'right'", description: 'Label before or after the box.' },
    { name: 'helperText', type: 'string', defaultValue: "''", description: 'Helper copy wired through aria-describedby.' },
    { name: 'requiredErrorMessage', type: 'string', defaultValue: "'This field is required.'", description: 'Message for touched or dirty required errors.' },
  ],
  outputs: [
    { name: 'checkedChange', type: 'boolean', description: 'Emits the next checked value after user interaction.' },
    { name: 'stateChange', type: 'PixelCheckboxStateChangeEvent', description: 'Emits checked, indeterminate, state, source, and original event.' },
    { name: 'focusChange', type: 'boolean', description: 'Emits when the native checkbox receives focus.' },
    { name: 'blurChange', type: 'boolean', description: 'Emits when the native checkbox loses focus.' },
    { name: 'click', type: 'MouseEvent | KeyboardEvent', description: 'Emits the original activation event.' },
  ],
  examples: CHECKBOX_EXAMPLES,
};
