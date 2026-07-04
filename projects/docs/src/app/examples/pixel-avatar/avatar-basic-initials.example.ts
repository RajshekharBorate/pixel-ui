import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-basic-initials-example',
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-basic-initials.example.html',
  styleUrl: './avatar-basic-initials.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarBasicInitialsExample {
  protected readonly people = ['Ada Brown', 'Carl Davis', 'Eva Frost', 'Gita Harper'];
}
