import { DocComponentMeta } from '../types';
import { DIVIDER_EXAMPLES } from '../../examples/pixel-divider';

export const DIVIDER_META: DocComponentMeta = {
  id: 'pixel-divider',
  title: 'Divider',
  selector: 'pixel-divider',
  category: 'layout',
  status: 'stable',
  summary:
    'Token-driven separator for horizontal and vertical rules, with optional inset spacing and labeled breaks.',
  overview: [
    'pixel-divider draws a thin rule between content groups, list items, or toolbar actions.',
    'Supports solid, dashed, and dotted strokes plus centered labels for OR-style section breaks.',
    'Vertical orientation requires a parent with defined height.',
  ],
  useCases: [
    'Section breaks in cards and forms',
    'List and menu item separators',
    'Toolbar action dividers',
  ],
  themingNotes: [
    'Override --pixel-divider-color, --pixel-divider-thickness, and --pixel-divider-inset.',
    'Label color uses --pixel-divider-label-color and --pixel-divider-label-gap.',
  ],
  accessibilityNotes: [
    'Renders role="separator" with aria-orientation reflecting direction.',
    'Decorative lines around a label are aria-hidden.',
  ],
  imports: ['PixelDividerComponent'],
  inputs: [
    { name: 'orientation', type: "'horizontal' | 'vertical'", defaultValue: "'horizontal'", description: 'Line direction.' },
    { name: 'variant', type: "'solid' | 'dashed' | 'dotted'", defaultValue: "'solid'", description: 'Stroke style.' },
    { name: 'inset', type: 'boolean', defaultValue: 'false', description: 'Symmetric margin so the rule does not touch edges.' },
    { name: 'labeled', type: 'boolean', defaultValue: 'false', description: 'Line — label — line layout.' },
    { name: 'labelAlign', type: "'start' | 'center' | 'end'", defaultValue: "'center'", description: 'Label position when labeled.' },
  ],
  outputs: [],
  composeWith: ['pixel-loader', 'pixel-button'],
  supports: ['theming', 'dark-mode', 'skeleton'],
  examples: DIVIDER_EXAMPLES,
};
