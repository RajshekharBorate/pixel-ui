import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelExpansionPanelComponent } from 'pixel-ui';

@Component({
  selector: 'docs-accordion-lazy-example',
  imports: [PixelExpansionPanelComponent],
  templateUrl: './accordion-lazy.example.html',
  styleUrl: './accordion-lazy.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionLazyExample {
  protected readonly open = signal(false);
  protected readonly lazyStamp = new Date().toLocaleTimeString();
}
