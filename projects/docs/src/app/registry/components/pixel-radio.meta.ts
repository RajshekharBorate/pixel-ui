import { DocComponentMeta } from '../types';
import { RADIO_EXAMPLES } from '../../examples/pixel-radio';

export const DOC_RADIO_META: DocComponentMeta = {
  id: 'pixel-radio',
  title: 'Radio',
  selector: 'pixel-radio-group',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Enterprise radio group with keyboard navigation, rich options, card layouts, and forms integration via pixel-radio-group.',
  overview: [
    'pixel-radio-group manages single selection, keyboard navigation, validation, and ControlValueAccessor integration.',
    'pixel-radio provides individual options declaratively via options input or content projection.',
    'Supports horizontal, vertical, and grid layouts with optional card, bordered, and filled variants.',
  ],
  useCases: [
    'Single-choice questions in reactive or template-driven forms',
    'Horizontal, vertical, or grid option layouts',
    'Card-style selectable plans or payment methods',
    'Rich options with icons, images, descriptions, and badges',
  ],
  themingNotes: [
    'Override --pixel-radio-selected and --pixel-radio-focus-ring on a host or ancestor.',
    'Supports prefers-color-scheme: dark and [data-theme="enterprise-dark"] overrides.',
    'Card options inherit surface and border tokens for selectable panels.',
  ],
  accessibilityNotes: [
    'Native input type="radio" with custom indicator inside each option.',
    'fieldset and legend semantics on the group with role="radiogroup" on option containers.',
    'Roving tabIndex within the group; arrow keys and Space/Enter selection.',
    'aria-checked, aria-required, aria-invalid, and aria-disabled on each option.',
  ],
  imports: ['PixelRadioGroupComponent', 'PixelRadioComponent'],
  inputs: [
    { name: 'value', type: 'unknown', defaultValue: 'null', description: 'Controlled selected value on the group.' },
    { name: 'options', type: 'PixelRadioOption[]', defaultValue: '[]', description: 'Declarative flat options.' },
    { name: 'label', type: 'string', defaultValue: "''", description: 'Fieldset legend text.' },
    { name: 'helperText', type: 'string', defaultValue: "''", description: 'Helper below the group.' },
    { name: 'layout', type: "'horizontal' | 'vertical' | 'grid'", defaultValue: "'vertical'", description: 'Layout mode.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Option density scale.' },
    { name: 'card', type: 'boolean', defaultValue: 'false', description: 'Card-style selectable options.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Disables the entire group.' },
    { name: 'required', type: 'boolean', defaultValue: 'false', description: 'Required validation on the group.' },
    { name: 'valueComparator', type: '(a, b) => boolean', defaultValue: 'Object.is', description: 'Value equality for object values.' },
  ],
  outputs: [
    { name: 'valueChange', type: 'unknown', description: 'Next selected value.' },
    { name: 'selectionChange', type: 'PixelRadioSelectionChangeEvent', description: 'Rich selection payload with source metadata.' },
    { name: 'focusChange', type: 'boolean', description: 'Focus state on the group.' },
    { name: 'blurChange', type: 'boolean', description: 'Blur state on the group.' },
    { name: 'keyboardSelection', type: 'PixelRadioSelectionChangeEvent', description: 'Selection triggered via keyboard.' },
  ],
  examples: RADIO_EXAMPLES,
};
