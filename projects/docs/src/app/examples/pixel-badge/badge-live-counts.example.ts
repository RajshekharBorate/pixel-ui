import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelBadgeComponent, PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-live-counts-example',
  imports: [PixelBadgeComponent, PixelButtonComponent],
  templateUrl: './badge-live-counts.example.html',
  styleUrl: './badge-live-counts.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeLiveCountsExample {
  protected readonly liveCount = signal(3);

  protected increment(): void {
    this.liveCount.update((value) => value + 1);
  }
}
