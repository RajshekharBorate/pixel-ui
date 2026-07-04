import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-configure-example',
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <div class="row">
      <pixel-button appearance="solid" (click)="apply()">Apply global config</pixel-button>
      <pixel-button appearance="outline" (click)="show()">Show toast</pixel-button>
      <pixel-button appearance="text" (click)="clear()">Clear all</pixel-button>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastConfigureExample {
  private readonly toast = inject(PixelToastService);

  protected apply(): void {
    this.toast.configure({
      position: 'bottom-right',
      maxVisible: 3,
      newestOnTop: true,
      variant: 'soft',
      timeOut: 4000,
    });
  }

  protected show(): void {
    this.toast.info('Configured defaults', 'Uses toast.configure() for position, queue, and variant.');
  }

  protected clear(): void {
    this.toast.clear();
  }
}
