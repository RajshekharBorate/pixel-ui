import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-variants-example',
  standalone: true,
  imports: [PixelBadgeComponent],
  templateUrl: './badge-variants.example.html',
  styleUrl: './badge-variants.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeVariantsExample {}
