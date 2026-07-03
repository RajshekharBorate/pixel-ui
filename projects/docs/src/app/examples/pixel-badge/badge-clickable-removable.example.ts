import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-clickable-removable-example',
  standalone: true,
  imports: [PixelBadgeComponent],
  templateUrl: './badge-clickable-removable.example.html',
  styleUrl: './badge-clickable-removable.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeClickableRemovableExample {
  protected readonly removed = signal(false);
  protected readonly clickLog = signal('No badge clicked yet.');

  protected onBadgeClick(label: string): void {
    this.clickLog.set('Clicked: ' + label);
  }

  protected onRemove(): void {
    this.removed.set(true);
    this.clickLog.set('Badge removed.');
  }
}
