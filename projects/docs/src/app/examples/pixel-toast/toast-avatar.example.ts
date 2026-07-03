import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-avatar-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="show()">Team notification</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastAvatarExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'custom',
      title: 'Maya Chen',
      message: 'Assigned you to the Q2 rollout.',
      imageSrc: 'https://i.pravatar.cc/40?img=32',
      category: 'Team',
      timestamp: new Date(),
    });
  }
}
