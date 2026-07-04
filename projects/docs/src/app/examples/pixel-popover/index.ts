import { createDocExample } from '../../shared/example-source.util';
import { PopoverBasicExample } from './popover-basic.example';
import { PopoverPositionsExample } from './popover-positions.example';

export const POPOVER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Rich interactive content',
    category: 'Basics',
    description:
      'A disclosure popover: click toggles, Escape restores trigger focus, outside click and ' +
      'Tab-out dismiss. Content stays fully interactive.',
    component: PopoverBasicExample,
    imports: ['PixelPopoverComponent', 'PixelPopoverTriggerDirective'],
    html: `<pixel-button appearance="tonal" [pixelPopoverTriggerFor]="release">What's new?</pixel-button>

<pixel-popover #release ariaLabel="Release notes">
  <h3>Version 2.4</h3>
  <p>14 fixes, dark-mode contrast tuning, and a faster data grid.</p>
  <pixel-button appearance="text" (click)="release.close()">Got it</pixel-button>
</pixel-popover>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelPopoverComponent, PixelPopoverTriggerDirective } from 'pixel-ui';

@Component({ /* … */ })
export class PopoverBasicExample {}`,
  }),
  createDocExample({
    id: 'positions',
    title: 'Positions & panel width',
    category: 'Positioning',
    description:
      'position (below/above) + align (start/center/end) pick the preferred placement — the ' +
      'panel flips when the viewport is cramped. panelWidth can mirror the trigger.',
    component: PopoverPositionsExample,
    imports: ['PixelPopoverComponent', 'PixelPopoverTriggerDirective'],
    html: `<pixel-button appearance="outline" [pixelPopoverTriggerFor]="aboveEnd">Above · end</pixel-button>

<pixel-popover #aboveEnd position="above" align="end">
  Prefers above, end-aligned — flips when cramped.
</pixel-popover>

<pixel-popover #matched panelWidth="match-trigger">Same inline-size as its trigger.</pixel-popover>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelPopoverComponent, PixelPopoverTriggerDirective } from 'pixel-ui';

@Component({ /* … */ })
export class PopoverPositionsExample {}`,
  }),
] as const;
