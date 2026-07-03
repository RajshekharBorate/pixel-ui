import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-duplicate-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="show()">Duplicate block test</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastDuplicateExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.configure({ duplicatePrevention: true });
    this.toast.info('Sync', 'Already in progress');
    this.toast.info('Sync', 'Already in progress');
  }
}
