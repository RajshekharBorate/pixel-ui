import {
  DestroyRef,
  ElementRef,
  InjectionToken,
  computed,
  effect,
  signal,
  type Signal,
} from '@angular/core';
import { trapFocus } from '../shared/overlay-utils';
import { PixelTourRef } from './pixel-tour-ref';
import type { PixelTourViewConfig } from './pixel-tour.types';

const AUTOPLAY_TICK_MS = 100;
const SWIPE_THRESHOLD_PX = 48;
const DRAG_VIEWPORT_MARGIN = 8;

/** @internal Provided by tour panel hosts for {@link default as PixelTourControlsComponent}. */
export const PIXEL_TOUR_PANEL_CONTROLLER = new InjectionToken<PixelTourPanelController>(
  'PIXEL_TOUR_PANEL_CONTROLLER',
);

/**
 * @internal Shared keyboard, focus, autoplay, drag, and swipe behavior for tour panels
 * (default card and custom card hosts).
 */
export class PixelTourPanelController {
  readonly hoverPaused = signal(false);
  readonly focusPaused = signal(false);
  readonly dragging = signal(false);

  readonly minimized: Signal<boolean>;

  private readonly remainingMs = signal(0);
  private stepDurationMs = 0;
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;

  private dragPointerId: number | null = null;
  private dragStart = { x: 0, y: 0, offsetX: 0, offsetY: 0 };
  private dragOffset = { x: 0, y: 0 };
  private touchStartX: number | null = null;
  private readonly resetDragOnResize = () => this.resetDrag();

  readonly countdownPercent: Signal<number>;
  readonly showCountdown: Signal<boolean>;

  constructor(
    private readonly hostRef: ElementRef<HTMLElement>,
    private readonly ref: PixelTourRef,
    private readonly config: PixelTourViewConfig,
    destroyRef: DestroyRef,
  ) {
    this.minimized = computed(
      () => this.ref.status() === 'paused' && this.config.pauseUi === 'minimize',
    );

    this.countdownPercent = computed(() =>
      this.stepDurationMs > 0 ? (this.remainingMs() / this.stepDurationMs) * 100 : 0,
    );

    this.showCountdown = computed(
      () =>
        this.config.autoplay !== null &&
        this.config.autoplay.showCountdown !== false &&
        this.ref.status() === 'running',
    );

    effect(() => {
      this.ref.stepIndex();
      if (this.ref.status() !== 'running' || typeof document === 'undefined') {
        return;
      }
      this.resetDrag();
      queueMicrotask(() => this.hostRef.nativeElement.focus());
    });

    effect((onCleanup) => {
      const autoplay = this.config.autoplay;
      const status = this.ref.status();
      const step = this.ref.activeStep();
      if (!autoplay || status !== 'running') {
        return;
      }
      this.stepDurationMs = step.autoAdvanceMs ?? autoplay.stepMs;
      this.remainingMs.set(this.stepDurationMs);
      this.autoplayTimer = setInterval(() => {
        const frozen =
          (autoplay.pauseOnHover !== false && this.hoverPaused()) ||
          (autoplay.pauseOnFocus !== false && this.focusPaused());
        if (frozen) {
          return;
        }
        const next = this.remainingMs() - AUTOPLAY_TICK_MS;
        this.remainingMs.set(Math.max(next, 0));
        if (next <= 0) {
          this.ref.next();
        }
      }, AUTOPLAY_TICK_MS);
      onCleanup(() => {
        if (this.autoplayTimer !== null) {
          clearInterval(this.autoplayTimer);
          this.autoplayTimer = null;
        }
      });
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resetDragOnResize, { passive: true });
    }
    destroyRef.onDestroy(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.resetDragOnResize);
      }
    });
  }

  togglePause(): void {
    if (this.ref.status() === 'paused') {
      this.ref.resume();
    } else {
      this.ref.pause();
    }
  }

  onFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    let keyboardFocus = false;
    try {
      keyboardFocus = target?.matches(':focus-visible') ?? false;
    } catch {
      keyboardFocus = true;
    }
    this.focusPaused.set(keyboardFocus);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      trapFocus(event, this.hostRef.nativeElement);
      return;
    }
    if (!this.config.keyboard) {
      return;
    }
    switch (event.key) {
      case 'Escape':
        event.stopPropagation();
        this.ref.abort();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.ref.next();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.ref.previous();
        break;
    }
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = this.config.gestures ? (event.changedTouches[0]?.clientX ?? null) : null;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null) {
      return;
    }
    const deltaX = (event.changedTouches[0]?.clientX ?? this.touchStartX) - this.touchStartX;
    this.touchStartX = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
      return;
    }
    if (deltaX < 0) {
      this.ref.next();
    } else {
      this.ref.previous();
    }
  }

  onGripPointerDown(event: PointerEvent): void {
    if (!this.config.draggable) {
      return;
    }
    event.preventDefault();
    this.dragPointerId = event.pointerId;
    this.dragStart = {
      x: event.clientX,
      y: event.clientY,
      offsetX: this.dragOffset.x,
      offsetY: this.dragOffset.y,
    };
    this.dragging.set(true);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onGripPointerMove(event: PointerEvent): void {
    if (!this.dragging() || event.pointerId !== this.dragPointerId) {
      return;
    }
    const host = this.hostRef.nativeElement;
    const rect = host.getBoundingClientRect();
    let deltaX = this.dragStart.offsetX + (event.clientX - this.dragStart.x);
    let deltaY = this.dragStart.offsetY + (event.clientY - this.dragStart.y);

    const currentX = rect.left - this.dragOffset.x;
    const currentY = rect.top - this.dragOffset.y;
    deltaX = Math.min(
      Math.max(deltaX, DRAG_VIEWPORT_MARGIN - currentX),
      window.innerWidth - rect.width - DRAG_VIEWPORT_MARGIN - currentX,
    );
    deltaY = Math.min(
      Math.max(deltaY, DRAG_VIEWPORT_MARGIN - currentY),
      window.innerHeight - rect.height - DRAG_VIEWPORT_MARGIN - currentY,
    );

    this.dragOffset = { x: deltaX, y: deltaY };
    host.style.translate = this.ref.activeStep().target
      ? `${deltaX}px ${deltaY}px`
      : `calc(-50% + ${deltaX}px) calc(-50% + ${deltaY}px)`;
  }

  onGripPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.dragPointerId) {
      return;
    }
    this.dragPointerId = null;
    this.dragging.set(false);
  }

  private resetDrag(): void {
    this.dragOffset = { x: 0, y: 0 };
    this.dragging.set(false);
    this.dragPointerId = null;
    this.hostRef.nativeElement.style.translate = '';
  }
}
