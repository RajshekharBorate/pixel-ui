import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Horizontal alignment of the projected action buttons. */
export type PixelStepActionsAlign = 'start' | 'center' | 'end' | 'between';

/**
 * Footer row for a step's navigation buttons (Back / Next / Finish / Cancel). Lays projected
 * buttons out in a flex row with consistent spacing and alignment. Purely presentational — wire the
 * buttons to the stepper's public methods (`next()`, `previous()`, `finish()`…) yourself.
 *
 * @example
 * ```html
 * <pixel-step-actions align="between">
 *   <pixel-button appearance="text" (click)="stepper.previous()">Back</pixel-button>
 *   <pixel-button appearance="solid" (click)="stepper.next()">Next</pixel-button>
 * </pixel-step-actions>
 * ```
 */
@Component({
  selector: 'pixel-step-actions',
  standalone: true,
  template: `<ng-content />`,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-block-start: 1.25rem;
      }
      :host([data-align='start']) {
        justify-content: flex-start;
      }
      :host([data-align='center']) {
        justify-content: center;
      }
      :host([data-align='end']) {
        justify-content: flex-end;
      }
      :host([data-align='between']) {
        justify-content: space-between;
      }
    `,
  ],
  host: {
    class: 'pixel-step-actions',
    '[attr.data-align]': 'align()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelStepActionsComponent {
  /**
   * @component How the projected buttons are distributed along the row.
   * @type {PixelStepActionsAlign}
   * @default 'between'
   */
  readonly align = input<PixelStepActionsAlign>('between');
}
