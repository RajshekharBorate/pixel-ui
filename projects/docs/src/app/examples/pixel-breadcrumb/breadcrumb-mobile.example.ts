import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({
  selector: 'docs-breadcrumb-mobile-example',
  imports: [PixelBreadcrumbComponent],
  templateUrl: './breadcrumb-mobile.example.html',
  styleUrl: './breadcrumb-mobile.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbMobileExample {
  protected readonly deepTrail: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/', icon: 'home' },
    { label: 'Products', link: '/products' },
    { label: 'Electronics', link: '/products/electronics' },
    { label: 'Computers', link: '/products/electronics/computers' },
    { label: 'Laptops', link: '/products/electronics/computers/laptops' },
    { label: 'Gaming notebooks' },
  ];
}
