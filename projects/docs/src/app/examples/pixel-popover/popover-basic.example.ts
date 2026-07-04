import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelPopoverComponent, PixelPopoverTriggerDirective } from 'pixel-ui';

@Component({
  selector: 'docs-popover-basic-example',
  imports: [PixelPopoverComponent, PixelPopoverTriggerDirective, PixelButtonComponent],
  template: `
    <pixel-button appearance="tonal" [pixelPopoverTriggerFor]="release">
      What's new?
    </pixel-button>

    <pixel-popover #release ariaLabel="Release notes">
      <h3 class="title">Version 2.4</h3>
      <p class="copy">
        14 fixes, dark-mode contrast tuning, and a faster data grid. Popovers hold rich,
        interactive content — unlike tooltips.
      </p>
      <pixel-button appearance="text" (click)="release.close()">Got it</pixel-button>
    </pixel-popover>
  `,
  styles: `
    .title { margin: 0 0 0.5rem; font-size: 1rem; }
    .copy { margin: 0 0 0.75rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopoverBasicExample {}
