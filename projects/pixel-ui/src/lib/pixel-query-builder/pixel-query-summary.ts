import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  formatQueryBuilderLabel,
  mergePixelQueryBuilderLabels,
  type PixelQueryBuilderLabels,
  type PixelQuerySummaryMode,
  type PixelQuerySummaryTree,
} from './pixel-query-builder.types';

@Component({
  selector: 'pixel-query-summary',
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
  /** Resolved chrome labels (passed from the host). */
  readonly labels = input<Partial<PixelQueryBuilderLabels>>({});

  protected readonly l = computed(() => mergePixelQueryBuilderLabels(this.labels()));
  protected readonly formatLabel = formatQueryBuilderLabel;

  protected conditionWord(condition: 'and' | 'or'): string {
    return condition === 'and' ? this.l().and : this.l().or;
  }

  protected conditionJoiner(condition: 'and' | 'or'): string {
    return condition === 'and' ? this.l().andJoiner : this.l().orJoiner;
  }
}
