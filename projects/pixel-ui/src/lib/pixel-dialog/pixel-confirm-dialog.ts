import { ChangeDetectionStrategy, Component, booleanAttribute, input, model, output } from '@angular/core';
import PixelDialogComponent from './pixel-dialog';
import PixelButtonComponent from '../pixel-button/pixel-button';

/**
 * A confirmation dialog built on `pixel-dialog`. Two-way bind `open`, supply copy via inputs, and
 * react to `confirmed` / `cancelled`. Project extra detail (e.g. an affected-items list) into the
 * default content slot.
 *
 * @example
 * ```html
 * <pixel-confirm-dialog
 *   [(open)]="confirmDelete"
 *   title="Delete policy"
 *   message="Are you sure you want to delete the selected policy?"
 *   confirmLabel="Delete"
 *   [danger]="true"
 *   (confirmed)="deleteNow()"
 * >
 *   <ul><li>Policy A</li></ul>
 * </pixel-confirm-dialog>
 * ```
 */
@Component({
  selector: 'pixel-confirm-dialog',
  standalone: true,
  imports: [PixelDialogComponent, PixelButtonComponent],
  template: `
    <pixel-dialog
      [(open)]="open"
      [title]="title()"
      size="sm"
      role="alertdialog"
      [dismissable]="!loading()"
      (closed)="onDialogClosed()"
    >
      @if (message()) {
        <p class="pixel-confirm-dialog__message">{{ message() }}</p>
      }
      <ng-content />

      <pixel-button pixelDialogFooter appearance="text" [disabled]="loading()" (click)="cancel()">
        {{ cancelLabel() }}
      </pixel-button>
      <pixel-button
        pixelDialogFooter
        [appearance]="'solid'"
        [state]="loading() ? 'loading' : danger() ? 'error' : 'default'"
        (click)="confirm()"
      >
        {{ confirmLabel() }}
      </pixel-button>
    </pixel-dialog>
  `,
  styles: [
    `
      .pixel-confirm-dialog__message {
        margin: 0;
        color: color-mix(in srgb, var(--pixel-sys-on-surface) 86%, transparent);
        font-size: var(--pixel-sys-label-md-size, 0.875rem);
        line-height: 1.5;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelConfirmDialogComponent {
  /** Two-way open state. */
  readonly open = model(false);

  /** Dialog heading. */
  readonly title = input('Please confirm');

  /** Body message. */
  readonly message = input('');

  /** Confirm button label. */
  readonly confirmLabel = input('Confirm');

  /** Cancel button label. */
  readonly cancelLabel = input('Cancel');

  /** Styles the confirm action as destructive. */
  readonly danger = input(false, { transform: booleanAttribute });

  /** Shows a loading state on the confirm action and blocks dismissal. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Emitted when the user confirms. */
  readonly confirmed = output<void>();

  /** Emitted when the user cancels (button, scrim, Escape, or close). */
  readonly cancelled = output<void>();

  private settled = false;

  protected confirm(): void {
    this.settled = true;
    this.confirmed.emit();
    if (!this.loading()) {
      this.open.set(false);
    }
  }

  protected cancel(): void {
    this.settled = true;
    this.cancelled.emit();
    this.open.set(false);
  }

  protected onDialogClosed(): void {
    // Treat dismissal (scrim/Escape/close button) as a cancel when not already settled.
    if (!this.settled) {
      this.cancelled.emit();
    }
    this.settled = false;
  }
}
