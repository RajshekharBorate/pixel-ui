import { DocComponentMeta } from '../types';
import { POPOVER_EXAMPLES } from '../../examples/pixel-popover';

export const POPOVER_META: DocComponentMeta = {
  id: 'pixel-popover',
  title: 'Popover',
  selector: 'pixel-popover',
  category: 'feedback',
  status: 'stable',
  summary:
    'Non-modal rich-content overlay anchored to a trigger — more than a tooltip, less than a dialog. Click toggles; Escape, outside click, and Tab-out dismiss.',
  overview: [
    'Pair pixel-popover with the [pixelPopoverTriggerFor] directive; the panel is body-relocated through the shared connected-overlay engine with viewport flipping.',
    'Non-modal role="dialog": content is fully interactive, focus moves in on open (autoFocus) and returns to the trigger on Escape.',
    'Use a popover when tooltip text is not enough (filters, previews, confirmations-in-place) but a modal dialog would be too heavy.',
  ],
  useCases: [
    'Inline filter/settings panels anchored to toolbar buttons',
    'Rich previews and detail cards on demand',
    'Lightweight confirm-in-place flows',
  ],
  themingNotes: [
    'Panel tokens (declared on the panel because it is body-relocated): --pixel-popover-background, --pixel-popover-color, --pixel-popover-border-color, --pixel-popover-radius, --pixel-popover-elevation, --pixel-popover-padding, --pixel-popover-max-inline-size.',
    'The trigger’s [data-theme] context is copied to the panel so dark mode follows automatically.',
  ],
  accessibilityNotes: [
    'Trigger carries aria-haspopup="dialog", aria-expanded, and aria-controls while open.',
    'Panel is role="dialog" with ariaLabel; Escape closes and restores trigger focus.',
    'Outside pointer and Tab-out close without stealing focus (disclosure semantics, no focus trap).',
    'Entrance animation is disabled under prefers-reduced-motion.',
  ],
  imports: ['PixelPopoverComponent', 'PixelPopoverTriggerDirective'],
  inputs: [
    { name: 'position', type: "'below' | 'above'", defaultValue: "'below'", description: 'Preferred vertical side (flips to fit).' },
    { name: 'align', type: "'start' | 'center' | 'end'", defaultValue: "'start'", description: 'Horizontal alignment against the trigger.' },
    { name: 'panelWidth', type: "'auto' | 'match-trigger' | string", defaultValue: "'auto'", description: 'Panel inline-size strategy.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible name for the dialog.' },
    { name: 'panelClass', type: 'string', defaultValue: "''", description: 'Extra class(es) on the body-relocated panel.' },
    { name: 'autoFocus', type: 'boolean', defaultValue: 'true', description: 'Move focus into the panel on open.' },
    { name: 'lockScroll', type: 'boolean', defaultValue: 'false', description: 'Freeze page scroll while open (default repositions).' },
  ],
  outputs: [
    { name: 'openedChange', type: 'boolean', description: 'Emits true on open, false on close.' },
    { name: 'closed', type: 'void', description: 'Emits when the popover finishes closing.' },
  ],
  examples: POPOVER_EXAMPLES,
};
