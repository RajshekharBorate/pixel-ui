import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
  type PixelToastVariant,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-variants-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <div class="row">
      @for (item of variants; track item.variant) {
        <pixel-button appearance="outline" (click)="show(item.variant)">
          {{ item.label }}
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
export class ToastVariantsExample {
  private readonly toast = inject(PixelToastService);

  protected readonly variants: readonly { variant: PixelToastVariant; label: string }[] = [
    { variant: 'soft', label: 'Soft variant' },
    { variant: 'solid', label: 'Solid variant' },
    { variant: 'outlined', label: 'Outlined variant' },
  ];

  protected show(variant: PixelToastVariant): void {
    this.toast.info('Policy saved', 'Compare soft, solid, and outlined surfaces.', { variant });
  }
}
