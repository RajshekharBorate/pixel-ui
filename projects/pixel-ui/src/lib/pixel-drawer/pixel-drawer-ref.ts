import { Subject, type Observable } from 'rxjs';

/**
 * Handle to a drawer opened via {@link PixelDrawerService.open}. Inject it in the opened component
 * to close the drawer and pass a result back to the caller; the caller observes the result through
 * {@link afterClosed}. Mirrors Angular Material's `MatDialogRef`.
 *
 * @typeParam R Type of the result passed to {@link close} and emitted by {@link afterClosed}.
 * @typeParam T Type of the opened component instance.
 */
export class PixelDrawerRef<R = unknown, T = unknown> {
  /** The opened component instance. Populated by the service before the drawer renders. */
  componentInstance: T | null = null;

  /**
   * True when {@link PixelDrawerService.open} refused the call (`config.requires` denied).
   * No overlay is created; {@link afterClosed} still completes.
   */
  readonly accessDenied: boolean;

  private readonly afterClosed$ = new Subject<R | undefined>();
  private readonly afterOpened$ = new Subject<void>();
  private readonly backdropClick$ = new Subject<void>();
  private readonly closeRequests$ = new Subject<void>();

  private result: R | undefined;
  private settled = false;

  /**
   * Internal channel the container subscribes to in order to start the close animation.
   * @internal
   */
  readonly closeRequests: Observable<void> = this.closeRequests$.asObservable();

  constructor(options?: { readonly accessDenied?: boolean }) {
    this.accessDenied = options?.accessDenied === true;
  }

  /** Close the drawer, optionally passing a result emitted by {@link afterClosed}. */
  close(result?: R): void {
    if (this.settled) {
      return;
    }
    this.result = result;
    this.closeRequests$.next();
  }

  /** Emits the result once, after the close animation completes, then completes. */
  afterClosed(): Observable<R | undefined> {
    return this.afterClosed$.asObservable();
  }

  /** Emits once, after the drawer has finished opening, then completes. */
  afterOpened(): Observable<void> {
    return this.afterOpened$.asObservable();
  }

  /** Emits on every scrim (backdrop) click, regardless of `disableClose`. */
  backdropClick(): Observable<void> {
    return this.backdropClick$.asObservable();
  }

  /** @internal */
  _emitOpened(): void {
    this.afterOpened$.next();
    this.afterOpened$.complete();
  }

  /** @internal */
  _emitBackdropClick(): void {
    this.backdropClick$.next();
  }

  /** @internal Called by the container once the exit animation has finished. */
  _finalizeClose(): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.closeRequests$.complete();
    this.backdropClick$.complete();
    this.afterClosed$.next(this.result);
    this.afterClosed$.complete();
  }
}
