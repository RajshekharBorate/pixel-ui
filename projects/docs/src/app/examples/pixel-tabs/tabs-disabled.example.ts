import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({
  selector: 'docs-tabs-disabled-example',
  imports: [PixelTabsComponent, PixelTabComponent],
  templateUrl: './tabs-disabled.example.html',
  styleUrl: './tabs-disabled.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsDisabledExample {}
