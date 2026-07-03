import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelProgressCircleComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-circular-gauge-example',
  standalone: true,
  imports: [PixelProgressCircleComponent],
  templateUrl: './progress-circular-gauge.example.html',
  styleUrl: './progress-circular-gauge.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressCircularGaugeExample {}
