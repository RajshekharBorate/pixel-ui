import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelProgressBarComponent, type PixelProgressThreshold } from 'pixel-ui';

@Component({
  selector: 'docs-progress-thresholds-example',
  imports: [PixelButtonComponent, PixelProgressBarComponent],
  templateUrl: './progress-thresholds.example.html',
  styleUrl: './progress-thresholds.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressThresholdsExample {
  protected readonly value = signal(35);
  protected readonly thresholds: readonly PixelProgressThreshold[] = [
    { from: 0, status: 'success', label: 'Healthy' },
    { from: 61, status: 'warning', label: 'Filling up' },
    { from: 81, status: 'error', label: 'Critical' },
  ];

  protected step(delta: number): void {
    this.value.update((current) => Math.min(100, Math.max(0, current + delta)));
  }
}
