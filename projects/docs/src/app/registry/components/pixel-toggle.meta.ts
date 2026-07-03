import { DocComponentMeta } from '../types';
import { TOGGLE_EXAMPLES } from '../../examples/pixel-toggle';

export const DOC_TOGGLE_META: DocComponentMeta = {
  id: 'pixel-toggle',
  title: 'Toggle',
  selector: 'pixel-toggle',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Accessible switch and segmented control with thumb icon projection, labeled tracks, and pixel-button-aligned segmented styling.',
  overview: [
    'pixel-toggle supports switch mode (boolean) and segmented mode (mutually exclusive string or number values).',
    'Switch mode uses role="switch" with optional projected thumb icons via pixelToggleCheckedIcon and pixelToggleUncheckedIcon.',
    'Segmented mode reuses pixel-button tokens for contained and surface appearances with rounded or pill shapes.',
  ],
  useCases: [
    'Boolean on/off settings with sliding thumb and optional icons',
    'In-track ON/OFF labeled switches for power or mode controls',
    'Segmented pill selectors for stay type, logical operators, or view modes',
    'Required acceptance toggles in reactive forms',
  ],
  themingNotes: [
    'Switch mode uses --pixel-toggle-track-on, --pixel-toggle-thumb-on, and disabled track/thumb tokens.',
    'Segmented mode inherits pixel-button tokens — radius, typography, padding, colors, and focus ring.',
    'Disabled checked switches use explicit muted track/thumb/icon colors instead of fading the whole control.',
  ],
  accessibilityNotes: [
    'Switch mode uses role="switch" with native checkbox semantics.',
    'Segmented mode uses role="radiogroup" and role="radio" with arrow-key navigation.',
    'Space and Enter activate; focus ring follows system focus tokens.',
    'Set segmentedAriaLabel when no external label is visible for segmented groups.',
  ],
  imports: [
    'PixelToggleComponent',
    'PixelToggleCheckedIconDirective',
    'PixelToggleUncheckedIconDirective',
    'PixelToggleThumbIconComponent',
  ],
  inputs: [
    { name: 'mode', type: "'switch' | 'segmented'", defaultValue: "'switch'", description: 'Switch or segmented control mode.' },
    { name: 'checked', type: 'boolean', defaultValue: 'false', description: 'Switch checked state.' },
    { name: 'value', type: 'string | number | null', defaultValue: 'null', description: 'Segmented selected value.' },
    { name: 'options', type: 'PixelToggleOption[]', defaultValue: '[]', description: 'Segmented option list.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Density scale; segmented reuses pixel-button tokens.' },
    { name: 'switchAppearance', type: "'default' | 'labeled'", defaultValue: "'default'", description: 'Default or in-track labeled switch.' },
    { name: 'segmentedAppearance', type: "'contained' | 'surface'", defaultValue: "'contained'", description: 'Segmented track styling.' },
    { name: 'segmentedShape', type: "'rounded' | 'pill'", defaultValue: "'rounded'", description: 'Button corners or capsule shape.' },
    { name: 'label', type: 'string', defaultValue: "''", description: 'External label for switch mode.' },
    { name: 'onLabel', type: 'string', defaultValue: "'ON'", description: 'In-track label when checked (labeled switch).' },
    { name: 'offLabel', type: 'string', defaultValue: "'OFF'", description: 'In-track label when unchecked (labeled switch).' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Disables interaction.' },
    { name: 'required', type: 'boolean', defaultValue: 'false', description: 'Form and UI required state.' },
  ],
  outputs: [
    { name: 'checkedChange', type: 'boolean', description: 'Emits the next switch checked value.' },
    { name: 'valueChange', type: 'string | number', description: 'Emits the next segmented selected value.' },
    { name: 'checkedStateChange', type: 'PixelToggleCheckedChangeEvent', description: 'Rich switch change payload.' },
    { name: 'valueStateChange', type: 'PixelToggleValueChangeEvent', description: 'Rich segmented change payload.' },
    { name: 'focusChange', type: 'boolean', description: 'Emits when the control receives focus.' },
    { name: 'blurChange', type: 'boolean', description: 'Emits when the control loses focus.' },
  ],
  examples: TOGGLE_EXAMPLES,
};
