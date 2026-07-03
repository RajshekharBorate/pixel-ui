import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({
  selector: 'docs-tabs-skeleton-example',
  standalone: true,
  imports: [PixelTabsComponent, PixelTabComponent, PixelCheckboxComponent],
  templateUrl: './tabs-skeleton.example.html',
  styleUrl: './tabs-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsSkeletonExample {
  protected readonly skeleton = signal(true);
}
