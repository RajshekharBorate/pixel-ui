import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({
  selector: 'docs-breadcrumb-icons-example',
  imports: [PixelBreadcrumbComponent],
  template: `
    <div class="stack">
      <pixel-breadcrumb [items]="trail" separatorIcon="chevron_right" />
      <pixel-breadcrumb [items]="trail" separator="›" />
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbIconsExample {
  protected readonly trail: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/', icon: 'home' },
    { label: 'Products', link: '/products', icon: 'inventory_2' },
    { label: 'Laptops', icon: 'laptop_mac' },
  ];
}
