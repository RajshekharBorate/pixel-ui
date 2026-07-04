import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-form-actions-example',
  imports: [PixelButtonComponent],
  template: `
    <div class="stack">
      <pixel-button appearance="solid" buttonType="submit" fullWidth trailingIcon="arrow_forward">
        Place order
      </pixel-button>
      <pixel-button appearance="text" fullWidth>Keep shopping</pixel-button>
    </div>
  `,
  styles: `
    .stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 20rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonFormActionsExample {}
