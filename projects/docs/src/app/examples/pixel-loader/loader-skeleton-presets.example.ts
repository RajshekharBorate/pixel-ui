import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelSkeletonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-loader-skeleton-presets-example',
  standalone: true,
  imports: [PixelSkeletonComponent],
  templateUrl: './loader-skeleton-presets.example.html',
  styleUrl: './loader-skeleton-presets.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderSkeletonPresetsExample {}
