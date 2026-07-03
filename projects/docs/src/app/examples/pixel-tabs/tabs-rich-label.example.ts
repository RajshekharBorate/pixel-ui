import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelTabComponent,
  PixelTabLabelDirective,
  PixelTabsComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-tabs-rich-label-example',
  standalone: true,
  imports: [PixelTabsComponent, PixelTabComponent, PixelTabLabelDirective],
  templateUrl: './tabs-rich-label.example.html',
  styleUrl: './tabs-rich-label.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsRichLabelExample {
  protected readonly inboxCount = signal(12);
}
