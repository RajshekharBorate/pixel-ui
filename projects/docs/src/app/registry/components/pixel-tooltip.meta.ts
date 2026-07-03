import { TOOLTIP_EXAMPLES } from '../../examples/pixel-tooltip';
import { DocComponentMeta } from '../types';

export const TOOLTIP_META: DocComponentMeta = {
  id: 'pixel-tooltip',
  title: 'Tooltip',
  selector: '[pixelTooltip]',
  category: 'feedback',
  status: 'stable',
  summary:
    'Accessible floating label directive for hover and focus with viewport-aware positioning and optional arrow tail.',
  overview: [
    'pixelTooltip attaches a floating label to any focusable host element.',
    'Preferred position flips automatically when the label would overflow the viewport.',
    'Supports plain labels, themed surfaces, arrow tails, and rich template content.',
  ],
  useCases: [
    'Explaining icon-only buttons and truncated table cells',
    'Keyboard-accessible help hints on focus',
    'Overflow-only tooltips for ellipsised labels',
    'Interactive coach marks with template content',
  ],
  themingNotes: [
    'Tooltip CSS ships in the shared styles/_tooltip.scss partial.',
    'Override --pixel-tooltip-bg and --pixel-tooltip-text for local customization.',
    'Themes: inverse (default), surface, and primary.',
  ],
  accessibilityNotes: [
    'Sets aria-describedby on the host while visible.',
    'Tooltip panel uses role="tooltip".',
    'Reveals on keyboard focus by default (trigger="both").',
    'Dismisses on host click and respects prefers-reduced-motion.',
  ],
  imports: ['PixelTooltipDirective'],
  inputs: [
    { name: 'pixelTooltip', type: 'string', defaultValue: "''", description: 'Tooltip text; empty disables it.' },
    { name: 'pixelTooltipPosition', type: "'top' | 'bottom' | 'left' | 'right'", defaultValue: "'top'", description: 'Preferred side; flips on overflow.' },
    { name: 'pixelTooltipTrigger', type: "'hover' | 'focus' | 'both'", defaultValue: "'both'", description: 'Interaction that reveals the tooltip.' },
    { name: 'pixelTooltipTheme', type: "'inverse' | 'surface' | 'primary'", defaultValue: "'inverse'", description: 'Visual style of the label.' },
    { name: 'pixelTooltipDisabled', type: 'boolean', defaultValue: 'false', description: 'Suppress without removing the directive.' },
    { name: 'pixelTooltipShowDelay', type: 'number', defaultValue: '150', description: 'Delay (ms) before showing.' },
    { name: 'pixelTooltipHideDelay', type: 'number', defaultValue: '0', description: 'Delay (ms) before hiding.' },
    { name: 'pixelTooltipMaxWidth', type: 'string', defaultValue: "'16rem'", description: 'Max inline size of the label.' },
    { name: 'pixelTooltipArrow', type: 'boolean', defaultValue: 'false', description: 'Opt in to a tail pointing at the host.' },
    { name: 'pixelTooltipShowOnOverflow', type: 'boolean', defaultValue: 'false', description: 'Show only when host text is clipped.' },
    { name: 'pixelTooltipContent', type: 'TemplateRef', description: 'Rich interactive tooltip content.' },
  ],
  outputs: [],
  examples: TOOLTIP_EXAMPLES,
};
