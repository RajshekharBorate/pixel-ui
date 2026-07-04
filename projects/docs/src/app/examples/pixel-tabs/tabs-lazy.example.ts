import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({
  selector: 'docs-tabs-lazy-example',
  imports: [PixelTabsComponent, PixelTabComponent],
  templateUrl: './tabs-lazy.example.html',
  styleUrl: './tabs-lazy.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsLazyExample {
  private readonly renderStamps = new Map<string, string>();

  protected renderStamp(label: string): string {
    let stamp = this.renderStamps.get(label);
    if (!stamp) {
      stamp = new Date().toLocaleTimeString();
      this.renderStamps.set(label, stamp);
    }
    return stamp;
  }
}
