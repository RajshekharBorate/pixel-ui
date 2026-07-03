import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelProgressBarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-linear-bar-example',
  standalone: true,
  imports: [PixelProgressBarComponent],
  templateUrl: './progress-linear-bar.example.html',
  styleUrl: './progress-linear-bar.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressLinearBarExample {}
