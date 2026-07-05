import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  Injector,
  TemplateRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelLoaderComponent from '../pixel-loader/pixel-loader';
import PixelProgressBarComponent from '../pixel-progress/pixel-progress-bar';
import { trapFocus } from '../shared/overlay-utils';
import { PixelTourRef } from './pixel-tour-ref';
import {
  PIXEL_TOUR_STEP_DATA,
  type PixelTourAutoplayOptions,
  type PixelTourButton,
  type PixelTourLabels,
  type PixelTourProgressStyle,
} from './pixel-tour.types';

/** @internal Resolved view options handed from the service to the card. */
export interface PixelTourViewConfig {
  readonly labels: PixelTourLabels;
  readonly progress: PixelTourProgressStyle;
  readonly keyboard: boolean;
  readonly autoplay: PixelTourAutoplayOptions | null;
  readonly pauseUi: 'none' | 'button' | 'minimize';
  readonly draggable: boolean;
  readonly gestures: boolean;
}

/** @internal */
export const PIXEL_TOUR_VIEW_CONFIG = new InjectionToken<PixelTourViewConfig>(
  'PIXEL_TOUR_VIEW_CONFIG',
);

let nextTourCardId = 0;

const DEFAULT_BUTTONS: readonly PixelTourButton[] = ['back', 'skip-tour', 'next'];
const AUTOPLAY_TICK_MS = 100;
const SWIPE_THRESHOLD_PX = 48;
const DRAG_VIEWPORT_MARGIN = 8;

/**
 * @internal The step card UI of a running tour: media, title, content (string, template,
 * or component), progress (count/dots/bar), autoplay countdown with pause/play, navigation
 * buttons, drag handle, swipe gestures, and the tour keyboard contract. Created by
 * `PixelTourService`; positioned by `ConnectedOverlay` or centered via CSS. Not public API.
 */
@Component({
  selector: 'pixel-tour-card',
  imports: [
    NgTemplateOutlet,
    NgComponentOutlet,
    PixelButtonComponent,
    PixelLoaderComponent,
    PixelProgressBarComponent,
  ],
  templateUrl: './pixel-tour-card.html',
  styleUrl: './pixel-tour-card.scss',
  host: {
    class: 'pixel-tour-card',
    role: 'dialog',
    'aria-modal': 'false',
    tabindex: '-1',
    '[class.pixel-tour-card--centered]': '!step().target',
    '[class.pixel-tour-card--minimized]': 'minimized()',
    '[class.pixel-tour-card--dragging]': 'dragging()',
    '[attr.aria-labelledby]': 'step().title ? titleId : null',
    '[attr.aria-label]': "step().title ? null : config.labels.stepAriaLabel",
    '[attr.aria-describedby]': 'bodyId',
    '(keydown)': 'onKeydown($event)',
    '(mouseenter)': 'hoverPaused.set(true)',
    '(mouseleave)': 'hoverPaused.set(false)',
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'focusPaused.set(false)',
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTourCardComponent {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ref = inject(PixelTourRef);
  protected readonly config = inject(PIXEL_TOUR_VIEW_CONFIG);

  protected readonly titleId = `pixel-tour-card-${++nextTourCardId}-title`;
  protected readonly bodyId = `pixel-tour-card-${nextTourCardId}-body`;

  protected readonly step = this.ref.activeStep;

  protected readonly minimized = computed(
    () => this.ref.status() === 'paused' && this.config.pauseUi === 'minimize',
  );

  protected readonly showPauseControl =
    this.config.pauseUi !== 'none' || this.config.autoplay !== null;

  // ---- autoplay countdown ----
  protected readonly hoverPaused = signal(false);
  protected readonly focusPaused = signal(false);
  private readonly remainingMs = signal(0);
  private stepDurationMs = 0;
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly countdownPercent = computed(() =>
    this.stepDurationMs > 0 ? (this.remainingMs() / this.stepDurationMs) * 100 : 0,
  );

  protected readonly showCountdown = computed(
    () =>
      this.config.autoplay !== null &&
      this.config.autoplay.showCountdown !== false &&
      this.ref.status() === 'running',
  );

  // ---- content rendering ----
  protected readonly stringContent = computed(() => {
    const content = this.step().content;
    return typeof content === 'string' ? content : null;
  });

  protected readonly templateContent = computed(() => {
    const content = this.step().content;
    return content instanceof TemplateRef ? content : null;
  });

  protected readonly componentContent = computed(() => {
    const content = this.step().content;
    return typeof content === 'string' || content instanceof TemplateRef ? null : content;
  });

  /** Injector for component content: exposes the active step's data payload. */
  protected readonly contentInjector = computed(() =>
    Injector.create({
      parent: this.injector,
      providers: [{ provide: PIXEL_TOUR_STEP_DATA, useValue: this.step().data ?? null }],
    }),
  );

  protected readonly buttons = computed(() => {
    const buttons = this.step().buttons ?? DEFAULT_BUTTONS;
    // Back is meaningless on the first step — drop it instead of rendering it disabled.
    return this.ref.stepIndex() === 0
      ? buttons.filter((button) => button !== 'back')
      : buttons;
  });

  protected readonly progressText = computed(() =>
    this.config.labels.progress
      .replace('{index}', String(this.ref.stepIndex() + 1))
      .replace('{total}', String(this.ref.total)),
  );

  protected readonly progressPercent = computed(
    () => ((this.ref.stepIndex() + 1) / this.ref.total) * 100,
  );

  protected readonly dots = computed(() =>
    Array.from({ length: this.ref.total }, (_unused, index) => index),
  );

  /** SR announcement per step: progress + title, via the card's polite live region. */
  protected readonly announcement = computed(() => {
    const title = this.step().title;
    return title ? `${this.progressText()}: ${title}` : this.progressText();
  });

  // ---- drag state ----
  protected readonly dragging = signal(false);
  private dragPointerId: number | null = null;
  private dragStart = { x: 0, y: 0, offsetX: 0, offsetY: 0 };
  private dragOffset = { x: 0, y: 0 };
  private touchStartX: number | null = null;
  private readonly resetDragOnResize = () => this.resetDrag();

  constructor() {
    // Move focus to the card whenever the step changes (and on open). Deferred a tick so the
    // overlay has positioned the card first. Also resets drag offset and autoplay countdown.
    effect(() => {
      this.ref.stepIndex();
      if (this.ref.status() !== 'running' || typeof document === 'undefined') {
        return;
      }
      this.resetDrag();
      queueMicrotask(() => this.hostRef.nativeElement.focus());
    });

    // Autoplay engine: one interval per active running step; hover/focus/pause freeze the
    // countdown without cancelling it (WCAG 2.2.1 — the user always has time control).
    effect((onCleanup) => {
      const autoplay = this.config.autoplay;
      const status = this.ref.status();
      const step = this.step();
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
    this.destroyRef.onDestroy(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.resetDragOnResize);
      }
    });
  }

  protected nextLabel(): string {
    return this.ref.isLastStep() ? this.config.labels.done : this.config.labels.next;
  }

  protected togglePause(): void {
    if (this.ref.status() === 'paused') {
      this.ref.resume();
    } else {
      this.ref.pause();
    }
  }

  protected onFocusIn(event: FocusEvent): void {
    // Only *keyboard* focus freezes the countdown: the card is auto-focused on every step,
    // so pausing on any focus would permanently stall autoplay. `:focus-visible` singles
    // out users who actually navigate by keyboard — they get unlimited reading time.
    const target = event.target as HTMLElement | null;
    let keyboardFocus = false;
    try {
      keyboardFocus = target?.matches(':focus-visible') ?? false;
    } catch {
      keyboardFocus = true; // Selector unsupported — err on the pausing side.
    }
    this.focusPaused.set(keyboardFocus);
  }

  protected onKeydown(event: KeyboardEvent): void {
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

  // ---- swipe ----

  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = this.config.gestures ? event.changedTouches[0]?.clientX ?? null : null;
  }

  protected onTouchEnd(event: TouchEvent): void {
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

  // ---- drag (pointer) ----

  protected onGripPointerDown(event: PointerEvent): void {
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

  protected onGripPointerMove(event: PointerEvent): void {
    if (!this.dragging() || event.pointerId !== this.dragPointerId) {
      return;
    }
    const host = this.hostRef.nativeElement;
    const rect = host.getBoundingClientRect();
    let deltaX = this.dragStart.offsetX + (event.clientX - this.dragStart.x);
    let deltaY = this.dragStart.offsetY + (event.clientY - this.dragStart.y);

    // Clamp so the card never leaves the viewport (margin on every edge).
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
    // Centered cards position via translate(-50%, -50%) — compose the drag offset with it.
    host.style.translate = this.step().target
      ? `${deltaX}px ${deltaY}px`
      : `calc(-50% + ${deltaX}px) calc(-50% + ${deltaY}px)`;
  }

  protected onGripPointerUp(event: PointerEvent): void {
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
