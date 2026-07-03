import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import PixelToastComponent from './pixel-toast';
import { PixelToastService } from './pixel-toast.service';
import type { PixelToastRecord } from './pixel-toast.types';

@Component({
  selector: 'pixel-toast-inline',
  standalone: true,
  imports: [PixelToastComponent],
  templateUrl: './pixel-toast-inline.html',
  styleUrl: './pixel-toast-inline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelToastInlineComponent {
  private readonly toastService = inject(PixelToastService);

  /** Matches `inlineAnchor` on toast config (default `default`). */
  readonly anchor = input('default');

  protected readonly toasts = computed(
    (): readonly PixelToastRecord[] =>
      this.toastService.visibleInlineByAnchor().get(this.anchor()) ?? [],
  );

  protected readonly regionLabel = computed(
    () => `Inline notifications ${this.anchor()}`,
  );
}
