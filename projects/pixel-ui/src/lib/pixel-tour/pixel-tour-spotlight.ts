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

/**
 * Overlapping or near-touching cutouts must be merged into one before drawing: with ANY
 * fill rule, intersecting hole subpaths leave artifacts (evenodd flips the intersection
 * back to filled scrim; nonzero winds it to -1 and fills it too). The union rect is also
 * the right UX — close-together multi-targets read as one spotlight.
 */
function mergeOverlapping(cutouts: readonly CutoutRect[]): CutoutRect[] {
  const merged = [...cutouts];
  const GAP = 2; // treat nearly-touching cutouts as one — a 1px scrim sliver looks broken
  for (let i = 0; i < merged.length; i++) {
    for (let j = i + 1; j < merged.length; j++) {
      const a = merged[i];
      const b = merged[j];
      const overlaps =
        a.x < b.x + b.width + GAP &&
        b.x < a.x + a.width + GAP &&
        a.y < b.y + b.height + GAP &&
        b.y < a.y + a.height + GAP;
      if (!overlaps) {
        continue;
      }
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      merged[i] = {
        x,
        y,
        width: Math.max(a.x + a.width, b.x + b.width) - x,
        height: Math.max(a.y + a.height, b.y + b.height) - y,
        radius: Math.max(a.radius, b.radius),
        circle: false, // a union of two shapes is a rounded rect
      };
      merged.splice(j, 1);
      i = -1; // restart — the union may now overlap earlier cutouts
      break;
    }
  }
  return merged;
}

function cutoutSubpath(cutout: CutoutRect): string {
  if (cutout.circle) {
    const cx = cutout.x + cutout.width / 2;
    const cy = cutout.y + cutout.height / 2;
    const r = Math.max(cutout.width, cutout.height) / 2;
    // Two sweep-0 arcs draw the circle counter-clockwise.
    return `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
  }
  const { x, y, width: w, height: h } = cutout;
  const r = Math.min(cutout.radius, w / 2, h / 2);
  return (
    `M${x + r} ${y}` +
    `A${r} ${r} 0 0 0 ${x} ${y + r}` +
    `V${y + h - r}A${r} ${r} 0 0 0 ${x + r} ${y + h}` +
    `H${x + w - r}A${r} ${r} 0 0 0 ${x + w} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 0 ${x + w - r} ${y}Z`
  );
}

/**
 * @internal Full-viewport scrim with spotlight cutouts over the tour targets, drawn as a
 * single SVG path (nonzero fill, reverse-wound cutouts). The cutout **morphs** between targets (FLIP-style lerp,
 * instant under reduced motion). In interactive mode pointer events pass through the holes
 * (the highlighted element stays clickable) and a pulsing ring marks them. In dark schemes a
 * subtle inner highlight lifts anchored cutouts. Created by
 * `PixelTourService` — not part of the public API.
 */
@Component({
  selector: 'pixel-tour-spotlight',
  template: `
    <svg class="pixel-tour-spotlight__svg" aria-hidden="true">
      <path
        class="pixel-tour-spotlight__scrim"
        [attr.d]="pathD()"
        fill-rule="nonzero"
        (click)="onScrimClick?.()"
      />
      @if (pulseD()) {
        <path class="pixel-tour-spotlight__highlight" [attr.d]="pulseD()" />
      }
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
    const next = mergeOverlapping(
      this.targets
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
        }),
    );

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
