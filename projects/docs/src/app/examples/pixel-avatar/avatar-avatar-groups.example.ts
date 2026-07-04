import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarGroupComponent, type PixelAvatarData } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-avatar-groups-example',
  imports: [PixelAvatarGroupComponent],
  templateUrl: './avatar-avatar-groups.example.html',
  styleUrl: './avatar-avatar-groups.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarAvatarGroupsExample {
  protected readonly team: readonly PixelAvatarData[] = [
    { name: 'Sam Wilson', status: 'online' },
    { name: 'Maya Chen', status: 'busy' },
    { name: 'Infra Team', initials: 'IT', color: '#0b8043' },
    { name: 'Leo Park' },
    { name: 'Nora Diaz' },
    { name: 'Omar Reed' },
    { name: 'Priya Rao' },
  ];
}
