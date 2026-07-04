import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAvatarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-clickable-example',
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-clickable.example.html',
  styleUrl: './avatar-clickable.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarClickableExample {
  protected readonly clickLog = signal('No avatar clicked yet.');

  protected onAvatarClick(name: string): void {
    this.clickLog.set('Clicked: ' + name);
  }
}
