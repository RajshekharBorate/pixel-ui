import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-queue-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="show()">Queue five toasts</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastQueueExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.configure({ maxVisible: 2, enableQueue: true });
    for (let i = 1; i <= 5; i++) {
      this.toast.info(`Queued #${i}`, `Toast ${i} of 5`);
    }
  }
}
