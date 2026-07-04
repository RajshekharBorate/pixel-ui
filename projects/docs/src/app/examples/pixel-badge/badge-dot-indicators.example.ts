import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-dot-indicators-example',
  imports: [PixelBadgeComponent],
  templateUrl: './badge-dot-indicators.example.html',
  styleUrl: './badge-dot-indicators.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDotIndicatorsExample {}
