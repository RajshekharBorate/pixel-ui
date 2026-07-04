import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelBreadcrumbComponent,
  type PixelBreadcrumbItem,
  type PixelBreadcrumbSize,
} from 'pixel-ui';

@Component({
  selector: 'docs-breadcrumb-sizes-example',
  imports: [PixelBreadcrumbComponent],
  templateUrl: './breadcrumb-sizes.example.html',
  styleUrl: './breadcrumb-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbSizesExample {
  protected readonly sizes: readonly PixelBreadcrumbSize[] = ['xs', 'sm', 'md', 'lg'];
  protected readonly trail: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/', icon: 'home' },
    { label: 'Products', link: '/products', icon: 'inventory_2' },
    { label: 'Laptops', icon: 'laptop_mac' },
  ];
}
