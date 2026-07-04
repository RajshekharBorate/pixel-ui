import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent, type PixelBadgeState } from 'pixel-ui';

@Component({
  selector: 'docs-badge-status-pills-example',
  imports: [PixelBadgeComponent],
  templateUrl: './badge-status-pills.example.html',
  styleUrl: './badge-status-pills.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeStatusPillsExample {
  protected readonly statuses: readonly { state: PixelBadgeState; label: string }[] = [
    { state: 'success', label: 'Completed' },
    { state: 'warning', label: 'Pending' },
    { state: 'error', label: 'Failed' },
    { state: 'info', label: 'Draft' },
    { state: 'active', label: 'Active' },
  ];
}
