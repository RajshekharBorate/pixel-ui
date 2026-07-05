import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { prefersReducedMotion } from '../shared/overlay-utils';
import type { PixelTourSpotlightOptions } from './pixel-tour.types';

interface CutoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  circle: boolean;
}

const DEFAULT_PADDING = 8;
const DEFAULT_RADIUS = 8;
const MORPH_MS = 280;

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

function cutoutSubpath(cutout: CutoutRect): string {
  if (cutout.circle) {
    const cx = cutout.x + cutout.width / 2;
    const cy = cutout.y + cutout.height / 2;
    const r = Math.max(cutout.width, cutout.height) / 2;
    // Two arcs make a full circle subpath; even-odd turns it into a hole.
    return `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
  }
  const { x, y, width: w, height: h } = cutout;
  const r = Math.min(cutout.radius, w / 2, h / 2);
  return (
    `M${x + r} ${y}` +
    `H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}` +
    `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  );
}

/**
 * @internal Full-viewport scrim with spotlight cutouts over the tour targets, drawn as a
 * single SVG path (even-odd fill). The cutout **morphs** between targets (FLIP-style lerp,
 * instant under reduced motion). In interactive mode pointer events pass through the holes
 * (the highlighted element stays clickable) and a pulsing ring marks them. Created by
 * `PixelTourService` — not part of the public API.
 */
@Component({
  selector: 'pixel-tour-spotlight',
  template: `
    <svg class="pixel-tour-spotlight__svg" aria-hidden="true">
      <path
        class="pixel-tour-spotlight__scrim"
        [attr.d]="pathD()"
        fill-rule="evenodd"
        (click)="onScrimClick?.()"
      />
      @if (interactive() && pulseD()) {
        <path class="pixel-tour-spotlight__pulse" [attr.d]="pulseD()" />
      }
    </svg>
  `,
  styleUrl: './pixel-tour-spotlight.scss',
  host: {
    class: 'pixel-tour-spotlight',
    '[class.pixel-tour-spotlight--interactive]': 'interactive()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTourSpotlightComponent {
  private readonly destroyRef = inject(DestroyRef);

  private readonly cutouts = signal<readonly CutoutRect[]>([]);
  private readonly viewport = signal({ width: 0, height: 0 });
  protected readonly interactive = signal(false);

  /** Set by the service: invoked when the user clicks the scrim. */
  onScrimClick: (() => void) | null = null;

  private targets: readonly Element[] = [];
  private options: PixelTourSpotlightOptions = {};
  private resizeObserver: ResizeObserver | null = null;
  private morphFrame: number | null = null;
  private readonly remeasure = () => this.measure(false);

  protected readonly pathD = computed(() => {
    const { width, height } = this.viewport();
    const outer = `M0 0H${width}V${height}H0Z`;
    return this.cutouts().reduce((d, cutout) => d + ' ' + cutoutSubpath(cutout), outer);
  });

  /** The cutout outlines only — stroked as the interactive pulse affordance. */
  protected readonly pulseD = computed(() =>
    this.cutouts()
      .map((cutout) => cutoutSubpath(cutout))
      .join(' '),
  );

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.remeasure, { passive: true });
      // Capture phase catches scrolls of any ancestor scroll container, not just the window.
      window.addEventListener('scroll', this.remeasure, { passive: true, capture: true });
    }
    this.destroyRef.onDestroy(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.remeasure);
        window.removeEventListener('scroll', this.remeasure, { capture: true });
      }
      this.resizeObserver?.disconnect();
      this.cancelMorph();
    });
  }

  /** @internal Re-anchors the cutouts to `targets` (empty for centered steps). */
  update(targets: readonly Element[], options: PixelTourSpotlightOptions = {}): void {
    this.targets = targets;
    this.options = options;
    this.interactive.set(options.interactive === true);
    this.resizeObserver?.disconnect();
    if (targets.length && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.remeasure);
      for (const target of targets) {
        this.resizeObserver.observe(target);
      }
    }
    this.measure(true);
  }

  /**
   * Recomputes cutout geometry. Step changes (`animate`) morph a single cutout to its new
   * rect; scroll/resize tracking and multi-cutout steps snap instantly.
   */
  private measure(animate: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.viewport.set({ width: window.innerWidth, height: window.innerHeight });

    const padding = this.options.padding ?? DEFAULT_PADDING;
    const next = this.targets
      .filter((target) => target.isConnected)
      .map((target): CutoutRect => {
        const rect = target.getBoundingClientRect();
        return {
          x: rect.left - padding,
          y: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          radius: this.options.radius ?? DEFAULT_RADIUS,
          circle: this.options.shape === 'circle',
        };
      });

    this.cancelMorph();
    const previous = this.cutouts();
    const canMorph =
      animate && previous.length === 1 && next.length === 1 && !prefersReducedMotion();
    if (!canMorph) {
      this.cutouts.set(next);
      return;
    }
    this.morph(previous[0], next[0]);
  }

  /** FLIP-style interpolation of one cutout rect into another. */
  private morph(from: CutoutRect, to: CutoutRect): void {
    const started = performance.now();
    const tick = (now: number) => {
      const t = easeOutCubic(Math.min((now - started) / MORPH_MS, 1));
      this.cutouts.set([
        {
          x: lerp(from.x, to.x, t),
          y: lerp(from.y, to.y, t),
          width: lerp(from.width, to.width, t),
          height: lerp(from.height, to.height, t),
          radius: lerp(from.radius, to.radius, t),
          // Swap the shape at the midpoint so circle↔rounded morphs read as one motion.
          circle: t < 0.5 ? from.circle : to.circle,
        },
      ]);
      if (t < 1) {
        this.morphFrame = requestAnimationFrame(tick);
      } else {
        this.morphFrame = null;
      }
    };
    this.morphFrame = requestAnimationFrame(tick);
  }

  private cancelMorph(): void {
    if (this.morphFrame !== null) {
      cancelAnimationFrame(this.morphFrame);
      this.morphFrame = null;
    }
  }
}
