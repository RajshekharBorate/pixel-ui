import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelHeaderComponent } from 'pixel-ui';

@Component({
  selector: 'docs-header-basic-example',
  standalone: true,
  imports: [PixelHeaderComponent, PixelButtonComponent],
  template: `
    <pixel-header>
      <h2 class="title">Dashboard</h2>
      <pixel-button
        pixelHeaderActions
        appearance="icon"
        leadingIcon="notifications"
        ariaLabel="Notifications"
      />
      <pixel-button
        pixelHeaderActions
        appearance="icon"
        leadingIcon="account_circle"
        ariaLabel="Account"
      />
    </pixel-header>
  `,
  styles: `
    .title {
      margin: 0;
      font-size: 1.125rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderBasicExample {}
