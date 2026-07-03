import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelChipComponent, PixelProgressBarComponent, type PixelProgressSegment } from 'pixel-ui';

@Component({
  selector: 'docs-progress-multi-segment-example',
  standalone: true,
  imports: [PixelChipComponent, PixelProgressBarComponent],
  templateUrl: './progress-multi-segment.example.html',
  styleUrl: './progress-multi-segment.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressMultiSegmentExample {
  protected readonly segments: readonly PixelProgressSegment[] = [
    { label: 'Documents', value: 32, status: 'info' },
    { label: 'Media', value: 24, status: 'warning' },
    { label: 'Backups', value: 14, status: 'success' },
    { label: 'Other', value: 8 },
  ];
}
