import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({
  selector: 'docs-breadcrumb-overflow-example',
  imports: [PixelBreadcrumbComponent],
  template: `
    <pixel-breadcrumb
      [items]="deepTrail"
      [maxVisibleItems]="4"
      overflowMode="dropdown"
      separatorIcon="chevron_right"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbOverflowExample {
  protected readonly deepTrail: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/', icon: 'home' },
    { label: 'Products', link: '/products' },
    { label: 'Electronics', link: '/products/electronics' },
    { label: 'Computers', link: '/products/electronics/computers' },
    { label: 'Laptops', link: '/products/electronics/computers/laptops' },
    { label: 'Gaming' },
  ];
}
