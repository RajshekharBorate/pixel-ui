import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-actions-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="show()">New comment</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastActionsExample {
  private readonly toast = inject(PixelToastService);

  protected readonly lastAction = signal('—');

  protected show(): void {
    this.toast.show({
      type: 'info',
      title: 'New comment',
      message: 'Alex replied on the billing thread.',
      actions: [
        { id: 'view', label: 'View', primary: true },
        { id: 'dismiss', label: 'Dismiss' },
      ],
      onAction: (id) => this.lastAction.set(id),
    });
  }
}
