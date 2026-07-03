import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-offline-online-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <pixel-button appearance="solid" (click)="simulate()">Simulate reconnect</pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOfflineOnlineExample {
  private readonly toast = inject(PixelToastService);

  protected simulate(): void {
    const offlineId = this.toast.offline('Offline', 'Changes will sync when you reconnect.');
    window.setTimeout(() => {
      this.toast.remove(offlineId);
      this.toast.online('Back online', 'All pending changes synced.');
    }, 2500);
  }
}
