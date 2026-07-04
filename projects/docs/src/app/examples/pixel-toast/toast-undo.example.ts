import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-undo-example',
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="show()">Archive item</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastUndoExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'default',
      title: 'Item archived',
      message: 'You can restore it within 10 seconds.',
      timeOut: 10000,
      undoAction: { id: 'undo', label: 'Undo' },
      onUndo: () => {
        this.toast.info('Restored', 'The item was moved back.');
      },
    });
  }
}
