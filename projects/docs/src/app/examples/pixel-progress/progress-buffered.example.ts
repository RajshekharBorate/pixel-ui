import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelProgressBarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-buffered-example',
  imports: [PixelProgressBarComponent],
  templateUrl: './progress-buffered.example.html',
  styleUrl: './progress-buffered.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBufferedExample {}
