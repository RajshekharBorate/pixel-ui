import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-loading-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="show()">Show loading</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastLoadingExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    const id = this.toast.loading('Processing', 'Please wait while we sync your workspace.');
    window.setTimeout(() => this.toast.remove(id), 4000);
  }
}
