import {
  ApplicationRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  type Type,
  createComponent,
  inject,
} from '@angular/core';
import { getOverlayContainer } from '../shared/overlay/connected-overlay';
import { PixelAuthorizationService } from '../services/authorization/authorization.service';
import type { PixelAuthorizationRequest } from '../services/authorization/authorization.types';
import PixelDialogContainerComponent, {
  distributeDialogSlotsFromContent,
  reclaimDialogSlots,
} from './pixel-dialog-container';
import { PixelDialogRef } from './pixel-dialog-ref';
import { PIXEL_DIALOG_DATA, type PixelDialogConfig } from './pixel-dialog.types';

function requiresAllowed(
  auth: PixelAuthorizationService | null,
  requires: string | PixelAuthorizationRequest | undefined,
): boolean {
  if (requires === undefined || requires === null) {
    return true;
  }
  if (typeof requires === 'string' && !requires.trim()) {
    return true;
  }
  if (!auth) {
    return false;
  }
  const request: PixelAuthorizationRequest =
    typeof requires === 'string'
      ? { permission: requires.trim(), action: 'view' }
      : requires;
  return auth.authorize(request).status === 'allow';
}

/**
 * Opens dialogs imperatively, hosting any component inside the shared `pixel-dialog` shell — the
 * Pixel equivalent of Angular Material's `MatDialog`. Inject it anywhere and call {@link open}:
 *
 * ```ts
 * const ref = dialog.open(EditPolicyComponent, { data: { id: 42 }, size: 'lg' });
 * ref.afterClosed().subscribe((result) => { … });
 * ```
 *
 * Inside the opened component, inject {@link PixelDialogRef} to close it (and return a result) and
 * {@link PIXEL_DIALOG_DATA} to read the payload. No global container component is required; each
 * dialog mounts its own overlay on `document.body` and tears it down on close.
 */
@Injectable({ providedIn: 'root' })
export class PixelDialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly auth = inject(PixelAuthorizationService, { optional: true });

  private readonly openRefs: PixelDialogRef[] = [];

  /** All currently-open dialog refs, in the order they were opened. */
  get openDialogs(): readonly PixelDialogRef[] {
    return this.openRefs;
  }

  /**
   * Open `component` in a modal dialog.
   *
   * @typeParam T Type of the component to instantiate.
   * @typeParam D Type of `config.data`.
   * @typeParam R Type of the result passed to `ref.close()`.
   * @returns A {@link PixelDialogRef} for closing the dialog and observing its lifecycle.
   */
  open<T, D = unknown, R = unknown>(
    component: Type<T>,
    config: PixelDialogConfig<D> = {},
  ): PixelDialogRef<R, T> {
    if (!requiresAllowed(this.auth, config.requires)) {
      const deniedRef = new PixelDialogRef<R, T>();
      queueMicrotask(() => {
        deniedRef.close();
        deniedRef._finalizeClose();
      });
      return deniedRef;
    }

    const dialogRef = new PixelDialogRef<R, T>();

    // Injector for the opened component: exposes the ref and the data payload.
    const contentInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: PixelDialogRef, useValue: dialogRef },
        { provide: PIXEL_DIALOG_DATA, useValue: config.data ?? null },
      ],
    });

    const contentRef = createComponent(component, {
      environmentInjector: this.environmentInjector,
      elementInjector: contentInjector,
    });
    dialogRef.componentInstance = contentRef.instance;

    // The container also needs the ref (to drive open/close and forward lifecycle events), but not
    // the data — keep its injector separate so consumers can't resolve PIXEL_DIALOG_DATA from it.
    const containerInjector = Injector.create({
      parent: this.injector,
      providers: [{ provide: PixelDialogRef, useValue: dialogRef }],
    });

    const containerRef = createComponent(PixelDialogContainerComponent, {
      environmentInjector: this.environmentInjector,
      elementInjector: containerInjector,
      projectableNodes: [[contentRef.location.nativeElement]],
    });
    containerRef.instance.config = config;
    containerRef.instance.contentHost = contentRef.location.nativeElement;

    this.appRef.attachView(contentRef.hostView);
    this.appRef.attachView(containerRef.hostView);
    getOverlayContainer().appendChild(containerRef.location.nativeElement);

    // Render synchronously so the inner dialog's open effect runs before the caller wires up
    // subscriptions on the next microtask.
    contentRef.changeDetectorRef.detectChanges();
    containerRef.changeDetectorRef.detectChanges();
    // Overlay may already be relocated — distribute from the content host via closest().
    distributeDialogSlotsFromContent(contentRef.location.nativeElement);

    const trackedRef = dialogRef as PixelDialogRef;
    this.openRefs.push(trackedRef);

    dialogRef.afterClosed().subscribe({
      complete: () => {
        const index = this.openRefs.indexOf(trackedRef);
        if (index > -1) {
          this.openRefs.splice(index, 1);
        }
        // `afterClosed` completes from within the dialog's change-detection pass (the exit
        // animation finishes during CD). Destroying views in that same pass corrupts Angular's
        // traversal, so defer disposal to the next microtask.
        queueMicrotask(() => {
          reclaimDialogSlots(contentRef.location.nativeElement);
          this.appRef.detachView(containerRef.hostView);
          this.appRef.detachView(contentRef.hostView);
          containerRef.destroy();
          contentRef.destroy();
          containerRef.location.nativeElement.remove();
        });
      },
    });

    return dialogRef;
  }

  /** Close every open dialog. */
  closeAll(): void {
    for (const ref of [...this.openRefs]) {
      ref.close();
    }
  }
}
