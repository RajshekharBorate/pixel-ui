import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-basic-example',
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="saveDraft()">Save draft</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastBasicExample {
  private readonly toast = inject(PixelToastService);

  protected saveDraft(): void {
    this.toast.success('Saved', 'Your draft was stored.');
  }
}
