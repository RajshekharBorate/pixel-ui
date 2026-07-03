import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent, type PixelAvatarStatus } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-presence-status-example',
  standalone: true,
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-presence-status.example.html',
  styleUrl: './avatar-presence-status.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarPresenceStatusExample {
  protected readonly statuses: readonly { status: PixelAvatarStatus; name: string }[] = [
    { status: 'online', name: 'Sam Wilson' },
    { status: 'away', name: 'Maya Chen' },
    { status: 'busy', name: 'Leo Park' },
    { status: 'offline', name: 'Nora Diaz' },
  ];
}
