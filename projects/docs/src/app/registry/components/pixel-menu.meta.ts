import { DocComponentMeta } from '../types';
import { MENU_EXAMPLES } from '../../examples/pixel-menu';

export const MENU_META: DocComponentMeta = {
  id: 'pixel-menu',
  title: 'Menu',
  selector: 'pixel-menu',
  category: 'navigation',
  status: 'stable',
  summary:
    'Accessible overlay menu with nested submenus, keyboard navigation, danger items, and viewport-aware positioning.',
  overview: [
    'pixel-menu pairs with pixelMenuTriggerFor on any trigger element.',
    'pixelMenuTrigger supports click (default), contextmenu (right-click / Shift+F10), or both.',
    'The panel relocates to document.body while open so it is never clipped.',
    'Nested submenus open on hover or ArrowRight from a parent menu item.',
  ],
  useCases: [
    'Row action overflow menus',
    'Nested file and share menus',
    'Right-click context menus on canvas and list surfaces',
    'Contextual toolbars and icon buttons',
  ],
  themingNotes: [
    'Menu styles ship in the shared styles/_menu.scss partial — import once at app root.',
    'Override --pixel-menu-bg, --pixel-menu-text, and --pixel-menu-hover for local theming.',
  ],
  accessibilityNotes: [
    'Uses role="menu" and role="menuitem" with roving focus.',
    'Supports Escape to close and Arrow keys for submenu navigation.',
    'Context menus also open via Shift+F10 / ContextMenu when the surface is focused.',
    'Set ariaLabel on each menu panel.',
  ],
  imports: ['PixelMenuComponent', 'PixelMenuItemComponent', 'PixelMenuTriggerDirective'],
  inputs: [
    { name: 'xPosition', type: "'before' | 'after'", defaultValue: "'after'", description: 'Horizontal alignment vs. the trigger.' },
    { name: 'yPosition', type: "'above' | 'below'", defaultValue: "'below'", description: 'Vertical alignment vs. the trigger.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible label for the menu panel.' },
    { name: 'panelClass', type: 'string', defaultValue: "''", description: 'Extra class on the panel.' },
    { name: 'lockScroll', type: 'boolean', defaultValue: 'true', description: 'Lock body scroll while the menu is open.' },
    { name: 'pixelMenuTrigger (directive)', type: "'click' | 'contextmenu' | 'both'", defaultValue: "'click'", description: 'How the trigger opens the menu.' },
    { name: 'icon (menu-item)', type: 'string', defaultValue: "''", description: 'Leading Material Symbols glyph on pixel-menu-item.' },
    { name: 'iconColor (menu-item)', type: "'default' | 'primary'", defaultValue: "'default'", description: 'Leading icon tint on pixel-menu-item.' },
    { name: 'variant (menu-item)', type: "'default' | 'danger'", defaultValue: "'default'", description: 'Destructive styling on pixel-menu-item.' },
    { name: 'disabled (menu-item)', type: 'boolean', defaultValue: 'false', description: 'Disable a menu row.' },
    { name: 'link (menu-item)', type: 'string | readonly unknown[]', description: 'Render row as routerLink navigation.' },
    { name: 'href (menu-item)', type: 'string', description: 'Render row as external href anchor.' },
  ],
  outputs: [
    { name: 'openedChange', type: 'boolean', description: 'Emits when open state changes.' },
    { name: 'closed', type: 'void', description: 'Emits when the menu closes.' },
    { name: 'selected (menu-item)', type: 'void', description: 'Fires when a leaf menu item is activated.' },
  ],
  examples: MENU_EXAMPLES,
};
