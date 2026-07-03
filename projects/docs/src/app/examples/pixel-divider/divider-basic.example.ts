import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelDividerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-divider-basic-example',
  standalone: true,
  imports: [PixelDividerComponent],
  template: `
    <div class="stack">
      <p>Account settings</p>
      <pixel-divider />
      <p>Notification preferences</p>
      <pixel-divider />
      <p>Danger zone</p>
    </div>
  `,
  styles: `
    .stack p {
      margin: 0;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerBasicExample {}
