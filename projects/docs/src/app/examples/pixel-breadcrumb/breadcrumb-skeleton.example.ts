import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelBreadcrumbComponent, PixelCheckboxComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({
  selector: 'docs-breadcrumb-skeleton-example',
  imports: [PixelBreadcrumbComponent, PixelCheckboxComponent],
  templateUrl: './breadcrumb-skeleton.example.html',
  styleUrl: './breadcrumb-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbSkeletonExample {
  protected readonly skeleton = signal(true);

  protected readonly items: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/' },
    { label: 'Components', link: '/components' },
    { label: 'Breadcrumb', active: true },
  ];
}
