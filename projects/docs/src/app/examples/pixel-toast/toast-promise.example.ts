import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-promise-example',
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="upload()">Upload file</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastPromiseExample {
  private readonly toast = inject(PixelToastService);

  protected upload(): void {
    void this.toast.promise(
      new Promise<void>((resolve) => window.setTimeout(resolve, 1600)),
      {
        loading: 'Uploading file…',
        success: 'Upload complete',
        error: 'Upload failed',
      },
    );
  }
}
