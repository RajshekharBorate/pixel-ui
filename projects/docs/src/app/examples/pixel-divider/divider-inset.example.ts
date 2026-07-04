import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelDividerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-divider-inset-example',
  imports: [PixelDividerComponent],
  templateUrl: './divider-inset.example.html',
  styleUrl: './divider-inset.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerInsetExample {}
