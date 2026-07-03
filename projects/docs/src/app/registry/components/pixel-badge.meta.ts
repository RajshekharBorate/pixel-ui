import { DocComponentMeta } from '../types';
import { BADGE_EXAMPLES } from '../../examples/pixel-badge';

export const DOC_BADGE_META: DocComponentMeta = {
  id: 'pixel-badge',
  title: 'Badge',
  selector: 'pixel-badge',
  category: 'data-display',
  status: 'stable',
  summary: 'Accessible notification indicator for counts, dots, status pills, and live updates anchored to icons, avatars, or buttons.',
  overview: [
    'pixel-badge anchors an overlay indicator to projected content or renders a standalone inline badge.',
    'Supports count overflow (99+, 999+), dot/pulse indicators, status pills, and animated live updates.',
    'Signal-driven with full light/dark theming via shared system tokens.',
  ],
  useCases: [
    'Notification counts on navigation icons and buttons',
    'Unread activity dot indicators',
    'Standalone status and label pills',
    'Presence dots on avatars',
    'Interactive clickable and removable badges',
  ],
  themingNotes: [
    'Semantic states map to shared success, warning, error, and info tokens.',
    'Pass a custom CSS color through the color input for one-off branding.',
    'Animated and pulse modes use component-level motion tokens.',
  ],
  accessibilityNotes: [
    'Provides aria-live announcements when counts change.',
    'Clickable badges render as native buttons with keyboard support.',
    'Set ariaLabel for icon-only or count-only contexts.',
  ],
  imports: ['PixelBadgeComponent'],
  inputs: [
    { name: 'value', type: 'number | string | null', defaultValue: 'null', description: 'Count or label value.' },
    { name: 'type', type: 'PixelBadgeType', defaultValue: '\'count\'', description: 'Content and use-case type.' },
    { name: 'position', type: 'PixelBadgePosition', defaultValue: '\'top-right\'', description: 'Overlay placement; inline for standalone.' },
    { name: 'max', type: 'number', defaultValue: '99', description: 'Overflow threshold (100 → 99+).' },
    { name: 'state', type: 'PixelBadgeState', defaultValue: '\'default\'', description: 'Semantic and interaction state.' },
    { name: 'animated', type: 'boolean', defaultValue: 'false', description: 'Pop transition on value change.' },
    { name: 'clickable', type: 'boolean', defaultValue: 'false', description: 'Renders an interactive button.' },
    { name: 'removable', type: 'boolean', defaultValue: 'false', description: 'Shows a remove affordance.' },
  ],
  outputs: [
    { name: 'badgeClick', type: 'PixelBadgeClickEvent', description: 'Interactive badge activated.' },
    { name: 'badgeRemove', type: 'PixelBadgeRemoveEvent', description: 'Remove affordance triggered.' },
    { name: 'valueChange', type: 'PixelBadgeValue', description: 'Value changed via the public API.' },
  ],
  examples: BADGE_EXAMPLES,
};
