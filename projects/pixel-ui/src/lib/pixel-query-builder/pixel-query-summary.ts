import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PixelQuerySummaryMode, PixelQuerySummaryTree } from './pixel-query-builder.types';

@Component({
  selector: 'pixel-query-summary',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './pixel-query-summary.html',
  styleUrl: './pixel-query-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-query-summary',
    '[class.pixel-query-summary--basic]': "mode() === 'basic'",
    '[class.pixel-query-summary--advanced]': "mode() === 'advanced'",
    'aria-live': 'polite',
  },
})
export default class PixelQuerySummaryComponent {
  readonly tree = input.required<PixelQuerySummaryTree>();
  readonly mode = input<PixelQuerySummaryMode>('advanced');
}
