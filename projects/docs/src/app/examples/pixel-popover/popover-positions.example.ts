import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelPopoverComponent, PixelPopoverTriggerDirective } from 'pixel-ui';

@Component({
  selector: 'docs-popover-positions-example',
  imports: [PixelPopoverComponent, PixelPopoverTriggerDirective, PixelButtonComponent],
  template: `
    <div class="row">
      <pixel-button appearance="outline" [pixelPopoverTriggerFor]="belowStart">
        Below · start
      </pixel-button>
      <pixel-button appearance="outline" [pixelPopoverTriggerFor]="belowCenter">
        Below · center
      </pixel-button>
      <pixel-button appearance="outline" [pixelPopoverTriggerFor]="aboveEnd">
        Above · end
      </pixel-button>
      <pixel-button appearance="outline" [pixelPopoverTriggerFor]="matched">
        Match trigger width
      </pixel-button>
    </div>

    <pixel-popover #belowStart position="below" align="start">Anchored below, start-aligned.</pixel-popover>
    <pixel-popover #belowCenter position="below" align="center">Anchored below, centered.</pixel-popover>
    <pixel-popover #aboveEnd position="above" align="end">Prefers above, end-aligned — flips when cramped.</pixel-popover>
    <pixel-popover #matched panelWidth="match-trigger">Same inline-size as its trigger.</pixel-popover>
  `,
  styles: `
    .row { display: flex; flex-wrap: wrap; gap: var(--pixel-sys-space-sm, 0.5rem); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopoverPositionsExample {}
