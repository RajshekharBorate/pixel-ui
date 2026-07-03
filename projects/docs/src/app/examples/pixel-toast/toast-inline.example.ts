import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastInlineComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-inline-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastInlineComponent],
  template: `
    <pixel-toast-inline />
    <p class="lede">Inline toasts render in document flow — ideal for form banners.</p>
    <div class="actions">
      <pixel-button appearance="outline" (click)="showWarning()">Show warning</pixel-button>
      <pixel-button appearance="text" (click)="clear()">Clear</pixel-button>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
    }

    .lede {
      margin: 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastInlineExample {
  private readonly toast = inject(PixelToastService);

  protected showWarning(): void {
    this.toast.inline({
      type: 'warning',
      variant: 'outlined',
      message: 'Session expires in 5 minutes.',
      disableTimeOut: true,
    });
  }

  protected clear(): void {
    this.toast.clearInline();
  }
}
