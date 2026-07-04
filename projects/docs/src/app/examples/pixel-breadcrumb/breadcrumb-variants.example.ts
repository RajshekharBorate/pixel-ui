import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelBreadcrumbComponent,
  type PixelBreadcrumbItem,
  type PixelBreadcrumbVariant,
} from 'pixel-ui';

@Component({
  selector: 'docs-breadcrumb-variants-example',
  imports: [PixelBreadcrumbComponent],
  templateUrl: './breadcrumb-variants.example.html',
  styleUrl: './breadcrumb-variants.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbVariantsExample {
  protected readonly variants: readonly PixelBreadcrumbVariant[] = [
    'minimal',
    'soft',
    'solid',
    'filled',
    'outline',
  ];
  protected readonly trail: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/', icon: 'home' },
    { label: 'Products', link: '/products', icon: 'inventory_2' },
    { label: 'Laptops', icon: 'laptop_mac' },
  ];
}
