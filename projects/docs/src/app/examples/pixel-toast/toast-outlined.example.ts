import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-outlined-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="outline" (click)="show()">Outlined overlay</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOutlinedExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.warning('Session expires in 5 minutes.', undefined, {
      variant: 'outlined',
      closeButton: true,
    });
  }
}
