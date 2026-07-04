import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import PixelDrawerComponent from './pixel-drawer';
import { PixelDrawerRef } from './pixel-drawer-ref';
import type { PixelDrawerConfig } from './pixel-drawer.types';

/**
 * Internal host created by {@link PixelDrawerService.open}. Wraps the shared `pixel-drawer` shell
 * (scrim, focus trap, slide animation, scroll lock) and projects the opened component into its body,
 * so the imperative path reuses the declarative component's behaviour rather than duplicating it.
 *
 * Not part of the public API.
 */
@Component({
  selector: 'pixel-drawer-container',
  imports: [PixelDrawerComponent],
  template: `
    <pixel-drawer
      [(open)]="open"
      [title]="config.title ?? ''"
      [position]="config.position ?? 'end'"
      [size]="config.size ?? 'md'"
      [dismissable]="!config.disableClose"
      [panelClass]="config.panelClass ?? ''"
      [ariaLabel]="config.ariaLabel ?? ''"
      [ariaDescribedBy]="config.ariaDescribedBy ?? ''"
      (opened)="drawerRef._emitOpened()"
      (scrimClick)="drawerRef._emitBackdropClick()"
      (closed)="drawerRef._finalizeClose()"
    >
      <ng-content />
    </pixel-drawer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelDrawerContainerComponent {
  protected readonly drawerRef = inject(PixelDrawerRef);

  /** Set by the service before the first change detection pass. */
  config: PixelDrawerConfig = {};

  // Starts open so the inner drawer plays its slide-in animation on first render; flipped to false
  // when the ref is asked to close, driving the slide-out animation.
  protected readonly open = signal(true);

  constructor() {
    this.drawerRef.closeRequests
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.open.set(false));
  }
}
