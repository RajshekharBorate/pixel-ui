import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-update-example',
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="run()">Sync workspace</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastUpdateExample {
  private readonly toast = inject(PixelToastService);

  protected run(): void {
    const id = this.toast.loading('Syncing', 'Fetching the latest workspace data…');
    window.setTimeout(() => {
      this.toast.update(id, {
        type: 'success',
        title: 'Sync complete',
        message: 'All projects are up to date.',
        disableTimeOut: false,
        timeOut: 4000,
        progressBar: true,
      });
    }, 2200);
  }
}
