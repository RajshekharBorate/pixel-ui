import { DocComponentMeta } from '../types';
import { BUTTON_EXAMPLES } from '../../examples/pixel-button';

export const DOC_BUTTON_META: DocComponentMeta = {
  id: 'pixel-button',
  title: 'Button',
  selector: 'pixel-button',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Standalone Angular button with Material M3–aligned appearances, sizes, semantic states, and signal-first toggle APIs.',
  overview: [
    'pixel-button is a standalone Angular 21 button for primary actions, async workflows, and controlled toggle patterns.',
    'It supports light and dark themes through shared system tokens and component-level CSS custom properties.',
    'Use appearances to match Material filled, outlined, text, elevated, tonal, icon, and mini-fab patterns.',
    'Related layout helpers: pixel-button-group (joined actions) and pixel-split-button (primary + menu caret).',
  ],
  useCases: [
    'Primary, secondary, and subtle action buttons',
    'Controlled toggle buttons with explicit input and output bindings',
    'Async submit buttons with loading feedback',
    'Status-aware actions for success and error states',
    'Joined button groups and split buttons with menus',
    'Theme-aware actions inside light and dark application shells',
  ],
  themingNotes: [
    'Import the shared Sass entry point once at app root with @include pixel.theme-root().',
    'Override system tokens on any ancestor with data-theme="enterprise-light" or data-theme="enterprise-dark".',
    'Layer component tokens such as --pixel-button-bg and --pixel-button-border for local customization.',
  ],
  accessibilityNotes: [
    'Uses a semantic native button element with keyboard activation.',
    'Supports aria-busy, aria-disabled, aria-pressed, and aria-describedby when appropriate.',
    'Provides a live region for async status updates announced to screen readers.',
    'Always set ariaLabel for icon-only buttons.',
  ],
  imports: [
    'PixelButtonComponent',
    'PixelButtonGroupComponent',
    'PixelSplitButtonComponent',
    'PixelMenuComponent',
    'PixelMenuItemComponent',
  ],
  inputs: [
    { name: 'id', type: 'string', defaultValue: "''", description: 'Optional native id for labels and tests.' },
    { name: 'buttonType', type: "'button' | 'submit' | 'reset'", defaultValue: "'button'", description: 'Native button type.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Visual size scale.' },
    { name: 'state', type: "'default' | 'disabled' | 'error' | 'success' | 'loading'", defaultValue: "'default'", description: 'Semantic state and interaction mode.' },
    { name: 'appearance', type: "'solid' | 'outline' | 'text' | 'elevated' | 'tonal' | 'icon' | 'mini-fab'", defaultValue: "'solid'", description: 'Material M3 appearance mapping.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Force-disables the control.' },
    { name: 'toggleable', type: 'boolean', defaultValue: 'false', description: 'Enables controlled toggle behavior.' },
    { name: 'fullWidth', type: 'boolean', defaultValue: 'false', description: 'Expands the button to container width.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible label for icon-only usage.' },
  ],
  outputs: [
    { name: 'click', type: 'MouseEvent | KeyboardEvent', description: 'Fires when the button is activated.' },
    { name: 'change', type: 'PixelButtonChangeEvent', description: 'Fires with the next pressed state for toggle flows.' },
    { name: 'toggle', type: 'boolean', description: 'Shorthand toggle event with the next pressed value.' },
  ],
  examples: BUTTON_EXAMPLES,
};
