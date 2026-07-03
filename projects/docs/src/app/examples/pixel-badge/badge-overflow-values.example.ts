import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-overflow-values-example',
  standalone: true,
  imports: [PixelBadgeComponent],
  templateUrl: './badge-overflow-values.example.html',
  styleUrl: './badge-overflow-values.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeOverflowValuesExample {
  protected readonly overflowValues = [1, 10, 99, 120, 1500, 12000] as const;
}
