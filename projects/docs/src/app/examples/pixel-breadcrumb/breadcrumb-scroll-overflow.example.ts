import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({
  selector: 'docs-breadcrumb-scroll-overflow-example',
  standalone: true,
  imports: [PixelBreadcrumbComponent],
  templateUrl: './breadcrumb-scroll-overflow.example.html',
  styleUrl: './breadcrumb-scroll-overflow.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbScrollOverflowExample {
  protected readonly deepTrail: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/', icon: 'home' },
    { label: 'Products', link: '/products' },
    { label: 'Electronics', link: '/products/electronics' },
    { label: 'Computers', link: '/products/electronics/computers' },
    { label: 'Laptops', link: '/products/electronics/computers/laptops' },
    { label: 'Gaming' },
  ];

  protected readonly lastClick = signal('');

  protected onClick(label: string): void {
    this.lastClick.set(label);
  }
}
