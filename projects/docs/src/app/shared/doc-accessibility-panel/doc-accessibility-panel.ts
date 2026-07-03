import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DocApiRow } from '../../registry/types';
import {
  DOC_A11Y_TESTING_TIPS,
  buildAccessibilityNotes,
  relatedAriaInputs,
} from './doc-accessibility.util';

@Component({
  selector: 'docs-accessibility-panel',
  standalone: true,
  templateUrl: './doc-accessibility-panel.html',
  styleUrl: './doc-accessibility-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocAccessibilityPanelComponent {
  readonly componentTitle = input.required<string>();
  readonly selector = input.required<string>();
  readonly notes = input.required<readonly string[]>();
  readonly inputs = input<readonly DocApiRow[]>([]);

  protected readonly categorizedNotes = computed(() => buildAccessibilityNotes(this.notes()));
  protected readonly ariaInputs = computed(() => relatedAriaInputs(this.inputs()));
  protected readonly testingTips = DOC_A11Y_TESTING_TIPS;
  protected readonly practiceCount = computed(() => this.notes().length);
}
