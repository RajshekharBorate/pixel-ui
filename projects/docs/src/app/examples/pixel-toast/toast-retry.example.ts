import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-retry-example',
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="show()">Simulate failure</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastRetryExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'error',
      title: 'Connection lost',
      message: 'We could not reach the API.',
      disableTimeOut: true,
      retryAction: { id: 'retry', label: 'Retry', primary: true },
      onRetry: () => {
        this.toast.success('Connected', 'The API is reachable again.');
      },
    });
  }
}
