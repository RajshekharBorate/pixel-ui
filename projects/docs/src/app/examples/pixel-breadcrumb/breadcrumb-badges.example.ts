import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({
  selector: 'docs-breadcrumb-badges-example',
  standalone: true,
  imports: [PixelBreadcrumbComponent],
  templateUrl: './breadcrumb-badges.example.html',
  styleUrl: './breadcrumb-badges.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbBadgesExample {
  protected readonly trail: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/', icon: 'home' },
    { label: 'Orders', link: '/orders', badge: 5 },
    { label: 'Notifications', badge: 10 },
  ];
}
