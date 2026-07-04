import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelProgressBarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-milestones-example',
  imports: [PixelButtonComponent, PixelProgressBarComponent],
  templateUrl: './progress-milestones.example.html',
  styleUrl: './progress-milestones.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressMilestonesExample {
  protected readonly value = signal(60);
  protected readonly milestones = [
    { at: 25, label: 'Draft' },
    { at: 50, label: 'Review' },
    { at: 75, label: 'Approved' },
    { at: 100, label: 'Published' },
  ] as const;

  protected step(delta: number): void {
    this.value.update((current) => Math.min(100, Math.max(0, current + delta)));
  }
}
