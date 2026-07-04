import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Structural wrapper for the body of a `pixel-step`. Provides consistent spacing and an enter
 * animation hook around projected step content. Purely presentational.
 *
 * @example
 * ```html
 * <pixel-step label="Details">
 *   <pixel-step-content>…form fields…</pixel-step-content>
 * </pixel-step>
 * ```
 */
@Component({
  selector: 'pixel-step-content',
  template: `<ng-content />`,
  styles: [
    `
      :host {
        display: block;
        color: var(--pixel-sys-on-surface);
        animation: pixel-step-content-enter var(--pixel-stepper-duration, 250ms) ease;
      }

      @keyframes pixel-step-content-enter {
        from {
          opacity: 0;
          transform: translateY(0.4rem);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        :host {
          animation: none;
        }
      }
    `,
  ],
  host: {
    class: 'pixel-step-content',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelStepContentComponent {}
