import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import PixelDialogComponent from './pixel-dialog';
import { PixelDialogRef } from './pixel-dialog-ref';
import type { PixelDialogConfig } from './pixel-dialog.types';

/**
 * Internal host created by {@link PixelDialogService.open}. Wraps the shared `pixel-dialog` shell
 * (scrim, focus trap, animation, scroll lock) and projects the opened component into its body, so
 * the imperative path reuses the declarative component's behaviour rather than duplicating it.
 *
 * Not part of the public API.
 */
@Component({
  selector: 'pixel-dialog-container',
  imports: [PixelDialogComponent],
  template: `
    <pixel-dialog
      [(open)]="open"
      [title]="config.title ?? ''"
      [size]="config.size ?? 'md'"
      [position]="config.position ?? 'center'"
      [role]="config.role ?? 'dialog'"
      [dismissable]="!config.disableClose"
      [panelClass]="config.panelClass ?? ''"
      [ariaLabel]="config.ariaLabel ?? ''"
      [ariaDescribedBy]="config.ariaDescribedBy ?? ''"
      (opened)="dialogRef._emitOpened()"
      (scrimClick)="dialogRef._emitBackdropClick()"
      (closed)="dialogRef._finalizeClose()"
    >
      <ng-content />
    </pixel-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelDialogContainerComponent {
  protected readonly dialogRef = inject(PixelDialogRef);

  /** Set by the service before the first change detection pass. */
  config: PixelDialogConfig = {};

  // Starts open so the inner dialog plays its enter animation on first render; flipped to false
  // when the ref is asked to close, driving the exit animation.
  protected readonly open = signal(true);

  constructor() {
    this.dialogRef.closeRequests
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.open.set(false));
  }
}
