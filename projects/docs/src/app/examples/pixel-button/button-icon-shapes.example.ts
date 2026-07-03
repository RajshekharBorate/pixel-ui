import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-icon-shapes-example',
  standalone: true,
  imports: [PixelButtonComponent],
  template: `
    <div class="row">
      <pixel-button appearance="icon" ariaLabel="Favorite" leadingIcon="favorite" />
      <pixel-button
        appearance="icon"
        fabShape="square"
        ariaLabel="Favorite"
        leadingIcon="favorite"
      />
      <pixel-button appearance="mini-fab" ariaLabel="Edit" leadingIcon="edit" />
      <pixel-button appearance="mini-fab" fabShape="square" ariaLabel="Edit" leadingIcon="edit" />
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonIconShapesExample {}
