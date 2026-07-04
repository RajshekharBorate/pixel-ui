import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-basic-example',
  imports: [PixelButtonComponent],
  template: `<pixel-button appearance="solid">Save changes</pixel-button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonBasicExample {}
