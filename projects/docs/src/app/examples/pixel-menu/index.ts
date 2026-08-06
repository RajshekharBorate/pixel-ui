import { createDocExample } from '../../shared/example-source.util';
import { MenuBasicExample } from './menu-basic.example';
import { MenuContextExample } from './menu-context.example';
import { MenuIconTriggerExample } from './menu-icon-trigger.example';
import { MenuPositionExample } from './menu-position.example';
import { MenuSubmenuExample } from './menu-submenu.example';

const MENU_IMPORTS = [
  'PixelMenuComponent',
  'PixelMenuItemComponent',
  'PixelMenuTriggerDirective',
] as const;

export const MENU_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic actions',
    category: 'Setup',
    description:
      'Pair pixelMenuTriggerFor on a trigger with a pixel-menu panel. Icons, danger variant, and disabled rows.',
    component: MenuBasicExample,
    imports: [...MENU_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-button [pixelMenuTriggerFor]="actions">Policy actions</pixel-button>

<pixel-menu #actions ariaLabel="Policy actions">
  <pixel-menu-item icon="visibility" iconColor="primary" (selected)="view()">View</pixel-menu-item>
  <pixel-menu-item icon="edit" (selected)="edit()">Edit</pixel-menu-item>
  <pixel-menu-item icon="delete" variant="danger" (selected)="remove()">Delete</pixel-menu-item>
</pixel-menu>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
} from 'pixel-ui';

@Component({ /* … */ })
export class MenuBasicExample {
  protected record(action: string): void { /* handle selection */ }
}`,
  }),
  createDocExample({
    id: 'context',
    title: 'Context menu',
    category: 'Behavior',
    description:
      'Set pixelMenuTrigger="contextmenu" to open at the pointer on right-click (or Shift+F10 / ContextMenu key when focused).',
    component: MenuContextExample,
    imports: [...MENU_IMPORTS],
    html: `<div
  class="surface"
  tabindex="0"
  [pixelMenuTriggerFor]="ctx"
  pixelMenuTrigger="contextmenu"
>
  Right-click (or focus and press Shift+F10)
</div>

<pixel-menu #ctx ariaLabel="Canvas actions">
  <pixel-menu-item icon="content_copy" (selected)="copy()">Copy</pixel-menu-item>
  <pixel-menu-item icon="content_paste" (selected)="paste()">Paste</pixel-menu-item>
</pixel-menu>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
} from 'pixel-ui';

@Component({ /* … */ })
export class MenuContextExample {}`,
  }),
  createDocExample({
    id: 'submenu',
    title: 'Nested submenus',
    category: 'Behavior',
    description:
      'Apply pixelMenuTriggerFor to a pixel-menu-item to open a submenu on hover or ArrowRight.',
    component: MenuSubmenuExample,
    imports: [...MENU_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-menu #root>
  <pixel-menu-item icon="share" [pixelMenuTriggerFor]="shareMenu">Share</pixel-menu-item>
</pixel-menu>

<pixel-menu #shareMenu>
  <pixel-menu-item icon="link" (selected)="copyLink()">Copy link</pixel-menu-item>
  <pixel-menu-item [pixelMenuTriggerFor]="teamMenu">To a team</pixel-menu-item>
</pixel-menu>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
} from 'pixel-ui';

@Component({ /* … */ })
export class MenuSubmenuExample {}`,
  }),
  createDocExample({
    id: 'position',
    title: 'Positioning',
    category: 'Edge',
    description:
      'xPosition (before/after) and yPosition (above/below) anchor the panel; it still flips near viewport edges (overflow).',
    component: MenuPositionExample,
    imports: [...MENU_IMPORTS, 'PixelButtonComponent'],
    html: `<div class="row">
  <pixel-button appearance="outline" [pixelMenuTriggerFor]="belowAfter">below / after</pixel-button>
  <pixel-button appearance="outline" [pixelMenuTriggerFor]="belowBefore">below / before</pixel-button>
  <pixel-button appearance="outline" [pixelMenuTriggerFor]="aboveAfter">above / after</pixel-button>
  <pixel-button appearance="outline" [pixelMenuTriggerFor]="aboveBefore">above / before</pixel-button>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
} from 'pixel-ui';

@Component({ /* … */ })
export class MenuPositionExample {}`,
  }),
  createDocExample({
    id: 'icon-trigger',
    title: 'Icon trigger',
    category: 'Accessibility',
    description:
      'Any element can be a trigger. Navigate with arrow keys; dismiss with Escape (edge: keyboard).',
    component: MenuIconTriggerExample,
    imports: [...MENU_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-button
  appearance="icon"
  ariaLabel="Row options"
  leadingIcon="more_vert"
  [pixelMenuTriggerFor]="menu"
/>

<pixel-menu #menu ariaLabel="Row options">
  <pixel-menu-item icon="push_pin" (selected)="pin()">Pin to top</pixel-menu-item>
  <pixel-menu-item icon="report" variant="danger" (selected)="report()">Report</pixel-menu-item>
</pixel-menu>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
} from 'pixel-ui';

@Component({ /* … */ })
export class MenuIconTriggerExample {}`,
    scss: `/* No extra styles needed */`,
  }),
] as const;
