import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-long-content-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="show()">Policy update</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastLongContentExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'warning',
      title: 'Policy update requires review before your organization can enable automated exports',
      message:
        'Sections 4.2, 7.1, and 9.4 changed regarding data retention in EU regions. ' +
        'Review the summary with your admin team, acknowledge the terms, and re-run the compliance ' +
        'check. Until then, scheduled exports stay paused.',
      contentMaxHeight: '10rem',
      disableTimeOut: true,
      actions: [{ id: 'review', label: 'Review policy', primary: true }],
    });
  }
}
