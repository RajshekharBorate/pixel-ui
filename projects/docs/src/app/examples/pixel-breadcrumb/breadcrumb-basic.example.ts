import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({
  selector: 'docs-breadcrumb-basic-example',
  imports: [PixelBreadcrumbComponent],
  template: `
    <pixel-breadcrumb [items]="trail" (itemClick)="onClick($event.item.label)" />
    @if (lastClick()) {
      <p class="log" role="status">Activated: {{ lastClick() }}</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
    }

    .log {
      margin: 0;
      font-size: 0.8125rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbBasicExample {
  protected readonly trail: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/' },
    { label: 'Products', link: '/products' },
    { label: 'Electronics', link: '/products/electronics' },
    { label: 'Laptops' },
  ];

  protected readonly lastClick = signal('');

  protected onClick(label: string): void {
    this.lastClick.set(label);
  }
}
