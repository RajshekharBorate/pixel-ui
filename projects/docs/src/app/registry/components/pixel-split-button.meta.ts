import { DocComponentMeta } from '../types';
import { BUTTON_EXAMPLES } from '../../examples/pixel-button';

const SPLIT_EXAMPLES = BUTTON_EXAMPLES.filter((example) => example.id === 'split-button');

export const SPLIT_BUTTON_META: DocComponentMeta = {
  id: 'pixel-split-button',
  title: 'Split button',
  selector: 'pixel-split-button',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Primary action plus caret menu: a split control that pairs pixel-button semantics with pixel-menu.',
  overview: [
    'pixel-split-button renders a main action and a menu trigger that opens a bound pixel-menu.',
    'Sizes and appearances align with pixel-button for visual consistency in toolbars.',
  ],
  useCases: [
    'Save / Save as… actions',
    'Export with format submenu',
    'Primary CTA with secondary variants',
  ],
  themingNotes: [
    'Reuses pixel-button appearance tokens; caret shares the same size scale.',
  ],
  accessibilityNotes: [
    'Primary control is a native button; caret exposes aria-haspopup / aria-expanded via the menu trigger.',
    'Provide ariaLabel when the primary action is icon-only.',
  ],
  imports: [
    'PixelSplitButtonComponent',
    'PixelMenuComponent',
    'PixelMenuItemComponent',
  ],
  inputs: [
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Visual size scale.' },
    { name: 'appearance', type: 'PixelButtonAppearance', defaultValue: "'solid'", description: 'Material-aligned appearance.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Disables primary and caret.' },
    { name: 'menu', type: 'PixelMenuComponent', defaultValue: '—', description: 'Bound pixel-menu instance.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible label for icon-only primary.' },
  ],
  outputs: [
    { name: 'click', type: 'MouseEvent | KeyboardEvent', description: 'Primary action activated.' },
  ],
  examples: SPLIT_EXAMPLES,
};
