import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-semantic-example',
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <div class="row">
      @for (item of semanticTypes; track item.type) {
        <pixel-button appearance="outline" (click)="show(item.type, item.title, item.message)">
          {{ item.title }}
        </pixel-button>
      }
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
export class ToastSemanticExample {
  private readonly toast = inject(PixelToastService);

  protected readonly semanticTypes = [
    { type: 'success' as const, title: 'Success', message: 'Changes were saved.' },
    { type: 'error' as const, title: 'Error', message: 'Payment could not be processed.' },
    { type: 'warning' as const, title: 'Warning', message: 'Session expires in 5 minutes.' },
    { type: 'info' as const, title: 'Info', message: 'Exports may take up to 24 hours.' },
  ];

  protected show(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
  ): void {
    switch (type) {
      case 'success':
        this.toast.success(title, message);
        break;
      case 'error':
        this.toast.error(title, message);
        break;
      case 'warning':
        this.toast.warning(title, message);
        break;
      case 'info':
        this.toast.info(title, message);
        break;
    }
  }
}
