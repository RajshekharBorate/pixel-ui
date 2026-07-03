import { DocComponentMeta } from '../types';
import { INPUT_EXAMPLES } from '../../examples/pixel-input';

export const DOC_INPUT_META: DocComponentMeta = {
  id: 'pixel-input',
  title: 'Input',
  selector: 'pixel-input',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Accessible text field with pill styling, affixes, password visibility, clear actions, and reactive or template-driven forms.',
  overview: [
    'pixel-input wraps a native input or textarea with signal-based inputs and explicit valueChange output.',
    'Built-in validator hooks for required, minLength, maxLength, and pattern integrate with Angular forms.',
    'Error styling, aria-invalid, and validation messages follow the bound control when invalid and touched or dirty.',
  ],
  useCases: [
    'Forms that need consistent Pixel styling while staying close to the platform input',
    'Dense tables or filters where sizes, affixes, and loading states matter',
    'Password fields with visibility toggle and clearable search or filter inputs',
    'Multiline notes with character counter and auto-resize textarea',
  ],
  themingNotes: [
    'All colors resolve through CSS variables on :host such as --pixel-input-border-focus.',
    'Override tokens locally for one-off treatments without changing global theme.',
    'Dark mode follows prefers-color-scheme: dark and [data-theme="enterprise-dark"] on any ancestor.',
  ],
  accessibilityNotes: [
    'Native label for wiring for every layout variant, including visually hidden labels.',
    'aria-describedby combines helper text, counter ids, and external ids.',
    'aria-invalid, aria-required, aria-disabled, and aria-readonly reflect the latest state.',
    'Enter emits enterPress; Escape clears the field when showClear is enabled.',
  ],
  imports: ['PixelInputComponent'],
  inputs: [
    { name: 'label', type: 'string', defaultValue: "''", description: 'Visible label text.' },
    { name: 'value', type: 'string', defaultValue: "''", description: 'Controlled value when not using Angular forms.' },
    { name: 'type', type: 'PixelInputType', defaultValue: "'text'", description: 'Native input type; ignored when multiline is true.' },
    { name: 'multiline', type: 'boolean', defaultValue: 'false', description: 'Renders a textarea instead of an input.' },
    { name: 'size', type: 'PixelInputSize', defaultValue: "'md'", description: 'Density token (xs, sm, md, lg).' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Disables the control.' },
    { name: 'readonly', type: 'boolean', defaultValue: 'false', description: 'Makes the field read-only.' },
    { name: 'required', type: 'boolean', defaultValue: 'false', description: 'Marks the field required and wires Validators.required.' },
    { name: 'loading', type: 'boolean', defaultValue: 'false', description: 'Shows a spinner (not inferred from the form control).' },
    { name: 'labelPosition', type: 'PixelInputLabelPosition', defaultValue: "'top'", description: 'top, left, floating, or hidden.' },
    { name: 'helperText', type: 'string', defaultValue: "''", description: 'Non-error hint; hidden while invalid and touched or dirty.' },
    { name: 'validationMessages', type: 'PixelInputValidationMessages', defaultValue: '{}', description: 'Map of ValidationErrors keys to messages.' },
    { name: 'maxLength', type: 'number', defaultValue: '0', description: 'Sets maxlength and shows a counter when greater than zero.' },
    { name: 'prefixText', type: 'string', defaultValue: "''", description: 'Leading affix text inside the field.' },
    { name: 'suffixText', type: 'string', defaultValue: "''", description: 'Trailing affix text inside the field.' },
    { name: 'showClear', type: 'boolean', defaultValue: 'false', description: 'Shows a clear button when a value exists.' },
    { name: 'showPasswordToggle', type: 'boolean', defaultValue: 'false', description: 'Shows visibility toggle when type is password.' },
  ],
  outputs: [
    { name: 'valueChange', type: 'string', description: 'Emits whenever the string value changes.' },
    { name: 'inputChange', type: 'string', description: 'Mirrors the native input event with the latest string.' },
    { name: 'focusChange', type: 'boolean', description: 'Emits true when the field receives focus.' },
    { name: 'blurChange', type: 'boolean', description: 'Emits true after blur.' },
    { name: 'enterPress', type: 'KeyboardEvent', description: 'Fires when Enter is pressed.' },
    { name: 'clearClick', type: 'MouseEvent', description: 'Fires when the clear button is pressed.' },
  ],
  examples: INPUT_EXAMPLES,
};
