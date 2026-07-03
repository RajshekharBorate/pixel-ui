import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-icon-buttons-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelTooltipDirective],
  template: `
    <div class="row">
      <pixel-button
        appearance="icon"
        ariaLabel="Edit"
        leadingIcon="edit"
        pixelTooltip="Edit"
        pixelTooltipPosition="top"
      />
      <pixel-button
        appearance="icon"
        ariaLabel="Duplicate"
        leadingIcon="content_copy"
        pixelTooltip="Duplicate"
        pixelTooltipPosition="top"
      />
      <pixel-button
        appearance="icon"
        ariaLabel="Delete permanently"
        leadingIcon="delete"
        class="danger-btn"
        pixelTooltip="Delete permanently"
        pixelTooltipPosition="top"
      />
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .danger-btn {
      --pixel-button-primary-label: var(--pixel-sys-error);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipIconButtonsExample {}
