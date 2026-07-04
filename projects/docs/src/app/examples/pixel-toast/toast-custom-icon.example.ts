import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-custom-icon-example',
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="show()">Milestone</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastCustomIconExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'custom',
      icon: 'celebration',
      title: 'Milestone',
      message: '100 deployments this week.',
      variant: 'solid',
    });
  }
}
