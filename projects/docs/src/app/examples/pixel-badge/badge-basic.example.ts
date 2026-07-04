import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-basic-example',
  imports: [PixelBadgeComponent],
  templateUrl: './badge-basic.example.html',
  styleUrl: './badge-basic.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeBasicExample {}
