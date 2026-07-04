import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
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

/**
 * @internal Full-viewport scrim with a spotlight cutout over the tour target, drawn as a
 * single SVG path (even-odd fill). Blocks page interaction while the tour runs; scrim
 * clicks are forwarded to the service (backdrop policy). Created by `PixelTourService` —
 * not part of the public API.
 */
@Component({
  selector: 'pixel-tour-spotlight',
  template: `
    <svg class="pixel-tour-spotlight__svg" aria-hidden="true" (click)="onScrimClick?.()">
      <path class="pixel-tour-spotlight__scrim" [attr.d]="pathD()" fill-rule="evenodd" />
    </svg>
  `,
  styleUrl: './pixel-tour-spotlight.scss',
  host: { class: 'pixel-tour-spotlight' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTourSpotlightComponent {
  private readonly destroyRef = inject(DestroyRef);

  private readonly cutout = signal<CutoutRect | null>(null);
  private readonly viewport = signal({ width: 0, height: 0 });

  /** Set by the service: invoked when the user clicks the scrim. */
  onScrimClick: (() => void) | null = null;

  private target: Element | null = null;
  private options: PixelTourSpotlightOptions = {};
  private resizeObserver: ResizeObserver | null = null;
  private readonly remeasure = () => this.measure();

  protected readonly pathD = computed(() => {
    const { width, height } = this.viewport();
    const outer = `M0 0H${width}V${height}H0Z`;
    const cutout = this.cutout();
    if (!cutout) {
      return outer;
    }
    if (cutout.circle) {
      const cx = cutout.x + cutout.width / 2;
      const cy = cutout.y + cutout.height / 2;
      const r = Math.max(cutout.width, cutout.height) / 2;
      // Two arcs make a full circle subpath; even-odd turns it into a hole.
      return `${outer} M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
    }
    const { x, y, width: w, height: h } = cutout;
    const r = Math.min(cutout.radius, w / 2, h / 2);
    return (
      `${outer} M${x + r} ${y}` +
      `H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}` +
      `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
      `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
      `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
    );
  });

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
    });
  }

  /** @internal Re-anchors the cutout to `target` (or removes it for centered steps). */
  update(target: Element | null, options: PixelTourSpotlightOptions = {}): void {
    this.target = target;
    this.options = options;
    this.resizeObserver?.disconnect();
    if (target && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.remeasure);
      this.resizeObserver.observe(target);
    }
    this.measure();
  }

  private measure(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.viewport.set({ width: window.innerWidth, height: window.innerHeight });
    if (!this.target || !this.target.isConnected) {
      this.cutout.set(null);
      return;
    }
    const rect = this.target.getBoundingClientRect();
    const padding = this.options.padding ?? DEFAULT_PADDING;
    this.cutout.set({
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      radius: this.options.radius ?? DEFAULT_RADIUS,
      circle: this.options.shape === 'circle',
    });
  }
}
