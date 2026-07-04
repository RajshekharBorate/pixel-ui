import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelFooterComponent } from 'pixel-ui';

@Component({
  selector: 'docs-footer-basic-example',
  imports: [PixelFooterComponent],
  template: `
    <pixel-footer>
      <span>© 2026 Acme Inc.</span>
      <span class="version">v1.0.0</span>
    </pixel-footer>
  `,
  styles: `
    .version {
      opacity: 0.75;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterBasicExample {}
