import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import PixelDialogComponent from './pixel-dialog';
import { PixelDialogRef } from './pixel-dialog-ref';
import type { PixelDialogConfig } from './pixel-dialog.types';

const FOOTER_SLOT = 'pixelDialogFooter';
const HEADER_SLOT = 'pixelDialogHeader';

function hasSlotAttribute(el: Element, name: string): boolean {
  // jsdom lowercases attributes on HTML elements; Angular hosts may keep mixed case.
  return el.hasAttribute(name) || el.hasAttribute(name.toLowerCase());
}

function findSlotNodes(root: ParentNode, name: string): Element[] {
  return Array.from(root.querySelectorAll('*')).filter((el) => hasSlotAttribute(el, name));
}

/**
 * Moves `[pixelDialogHeader]` / `[pixelDialogFooter]` nodes from an imperatively opened content
 * host into the dialog chrome. Uses `closest` so it still works after `pixel-dialog` relocates its
 * overlay onto the shared overlay container (out of the container component host).
 *
 * @internal
 */
export function distributeDialogSlotsFromContent(contentHost: HTMLElement): void {
  const body = contentHost.closest('.pixel-dialog__body');
  const surface = body?.closest('.pixel-dialog__surface');
  const footer = surface?.querySelector('.pixel-dialog__footer');
  const header = surface?.querySelector('.pixel-dialog__header');
  if (!body || !footer || !header) {
    return;
  }

  for (const node of findSlotNodes(contentHost, FOOTER_SLOT)) {
    if (node.parentElement !== footer) {
      footer.appendChild(node);
    }
  }

  for (const node of findSlotNodes(contentHost, HEADER_SLOT)) {
    if (node.parentElement !== header) {
      const title = header.querySelector('.pixel-dialog__title');
      header.insertBefore(node, title ?? header.querySelector('.pixel-dialog__close'));
    }
  }
}

/**
 * Returns slotted nodes to `contentHost` before the content view is destroyed so Angular does not
 * emit on outputs after destroy (NG0953).
 *
 * @internal
 */
export function reclaimDialogSlots(contentHost: HTMLElement): void {
  const body = contentHost.closest('.pixel-dialog__body');
  const surface = body?.closest('.pixel-dialog__surface') ?? contentHost.closest('.pixel-dialog__surface');
  const footer = surface?.querySelector('.pixel-dialog__footer');
  const header = surface?.querySelector('.pixel-dialog__header');
  if (footer) {
    for (const node of findSlotNodes(footer, FOOTER_SLOT)) {
      contentHost.appendChild(node);
    }
  }
  if (header) {
    for (const node of findSlotNodes(header, HEADER_SLOT)) {
      contentHost.appendChild(node);
    }
  }
}

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
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly dialogRef = inject(PixelDialogRef);

  /** Set by the service before the first change detection pass. */
  config: PixelDialogConfig = {};

  /**
   * Imperative content host — set by {@link PixelDialogService} so slot redistribution still works
   * after the dialog overlay relocates to the shared overlay container.
   */
  contentHost: HTMLElement | null = null;

  // Starts open so the inner dialog plays its enter animation on first render; flipped to false
  // when the ref is asked to close, driving the exit animation.
  protected readonly open = signal(true);

  constructor() {
    this.dialogRef.closeRequests
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.open.set(false));

    // Keep slots in sync when content re-renders (e.g. soft-ask view changes).
    afterRenderEffect(() => {
      const content = this.contentHost;
      if (content) {
        distributeDialogSlotsFromContent(content);
      }
    });
  }
}
