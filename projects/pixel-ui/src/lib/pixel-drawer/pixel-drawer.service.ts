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
import {
  PIXEL_AUTHORIZATION_EVALUATOR,
  type PixelAuthorizationEvaluator,
} from '../shared/authorization-evaluator';
import type { PixelAuthorizationRequest } from '../services/authorization/authorization.types';
import PixelDrawerContainerComponent from './pixel-drawer-container';
import { PixelDrawerRef } from './pixel-drawer-ref';
import { PIXEL_DRAWER_DATA, type PixelDrawerConfig } from './pixel-drawer.types';

function requiresAllowed(
  auth: PixelAuthorizationEvaluator | null,
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
  auth.snapshotVersion();
  const request: PixelAuthorizationRequest =
    typeof requires === 'string'
      ? { permission: requires.trim() }
      : requires;
  return auth.evaluate(request).status === 'allow';
}

/**
 * Opens drawers imperatively, hosting any component inside the shared `pixel-drawer` shell — the
 * drawer counterpart to {@link PixelDialogService} (and Angular Material's `MatDialog`). Inject it
 * anywhere and call {@link open}:
 *
 * ```ts
 * const ref = drawer.open(CreatePolicyWizard, { position: 'end', size: 'lg', data: { id: 42 } });
 * ref.afterClosed().subscribe((result) => { … });
 * ```
 *
 * Inside the opened component, inject {@link PixelDrawerRef} to close it (and return a result) and
 * {@link PIXEL_DRAWER_DATA} to read the payload. No global container component is required; each
 * drawer mounts its own overlay on `document.body` and tears it down on close.
 */
@Injectable({ providedIn: 'root' })
export class PixelDrawerService {
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly auth = inject(PIXEL_AUTHORIZATION_EVALUATOR, { optional: true });

  private readonly openRefs: PixelDrawerRef[] = [];

  /** All currently-open drawer refs, in the order they were opened. */
  get openDrawers(): readonly PixelDrawerRef[] {
    return this.openRefs;
  }

  /**
   * Open `component` in a modal drawer.
   *
   * @typeParam T Type of the component to instantiate.
   * @typeParam D Type of `config.data`.
   * @typeParam R Type of the result passed to `ref.close()`.
   * @returns A {@link PixelDrawerRef} for closing the drawer and observing its lifecycle.
   */
  open<T, D = unknown, R = unknown>(
    component: Type<T>,
    config: PixelDrawerConfig<D> = {},
  ): PixelDrawerRef<R, T> {
    if (!requiresAllowed(this.auth, config.requires)) {
      const deniedRef = new PixelDrawerRef<R, T>({ accessDenied: true });
      queueMicrotask(() => {
        deniedRef.close();
        deniedRef._finalizeClose();
      });
      return deniedRef;
    }

    const drawerRef = new PixelDrawerRef<R, T>();

    // Injector for the opened component: exposes the ref and the data payload.
    const contentInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: PixelDrawerRef, useValue: drawerRef },
        { provide: PIXEL_DRAWER_DATA, useValue: config.data ?? null },
      ],
    });

    const contentRef = createComponent(component, {
      environmentInjector: this.environmentInjector,
      elementInjector: contentInjector,
    });
    drawerRef.componentInstance = contentRef.instance;

    // The container also needs the ref (to drive open/close and forward lifecycle events), but not
    // the data — keep its injector separate so consumers can't resolve PIXEL_DRAWER_DATA from it.
    const containerInjector = Injector.create({
      parent: this.injector,
      providers: [{ provide: PixelDrawerRef, useValue: drawerRef }],
    });

    const containerRef = createComponent(PixelDrawerContainerComponent, {
      environmentInjector: this.environmentInjector,
      elementInjector: containerInjector,
      projectableNodes: [[contentRef.location.nativeElement]],
    });
    containerRef.instance.config = config;

    this.appRef.attachView(contentRef.hostView);
    this.appRef.attachView(containerRef.hostView);
    getOverlayContainer().appendChild(containerRef.location.nativeElement);

    // Render synchronously so the inner drawer's open effect runs before the caller wires up
    // subscriptions on the next microtask.
    contentRef.changeDetectorRef.detectChanges();
    containerRef.changeDetectorRef.detectChanges();

    const trackedRef = drawerRef as PixelDrawerRef;
    this.openRefs.push(trackedRef);

    drawerRef.afterClosed().subscribe({
      complete: () => {
        const index = this.openRefs.indexOf(trackedRef);
        if (index > -1) {
          this.openRefs.splice(index, 1);
        }
        // `afterClosed` completes from within the drawer's change-detection pass (the exit
        // animation finishes during CD). Destroying views in that same pass corrupts Angular's
        // traversal, so defer disposal to the next microtask.
        queueMicrotask(() => {
          this.appRef.detachView(containerRef.hostView);
          this.appRef.detachView(contentRef.hostView);
          containerRef.destroy();
          contentRef.destroy();
          containerRef.location.nativeElement.remove();
        });
      },
    });

    return drawerRef;
  }

  /** Close every open drawer. */
  closeAll(): void {
    for (const ref of [...this.openRefs]) {
      ref.close();
    }
  }
}
