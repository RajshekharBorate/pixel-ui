import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelAccordionComponent,
  PixelButtonComponent,
  PixelExpansionPanelComponent,
  type PixelAccordionSize,
} from 'pixel-ui';

@Component({
  selector: 'docs-accordion-sizes-example',
  imports: [PixelAccordionComponent, PixelExpansionPanelComponent, PixelButtonComponent],
  templateUrl: './accordion-sizes.example.html',
  styleUrl: './accordion-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionSizesExample {
  protected readonly sizes: readonly PixelAccordionSize[] = ['sm', 'md', 'lg'];
  protected readonly activeSize = signal<PixelAccordionSize>('md');
}
