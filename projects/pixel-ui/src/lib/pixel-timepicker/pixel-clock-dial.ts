import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  inject,
  input,
  model,
  output,
  signal,
  computed,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { PixelTimepickerFormat, PixelTimepickerView } from './pixel-timepicker.types';

const DIAL_SIZE = 220;
const CENTER = DIAL_SIZE / 2;
const OUTER_R = 86;   // radius for outer ring numbers
const INNER_R = 56;   // radius for inner ring (13-23 in 24h)
const ITEM_R = 19;    // hit-circle radius around each number

interface DialItem {
  readonly value: number;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly inner: boolean; // inner ring (hours 13-23 in 24h)
}

function angleForIndex(index: number, total: number): number {
  // 0 = 12 o'clock (top), clockwise. Returns radians.
  return (index / total) * 2 * Math.PI - Math.PI / 2;
}

function valueToAngle(value: number, total: number): number {
  return ((value % total) / total) * 2 * Math.PI - Math.PI / 2;
}

@Component({
  selector: 'pixel-clock-dial',
  standalone: true,
  templateUrl: './pixel-clock-dial.html',
  styleUrl: './pixel-clock-dial.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelClockDialComponent {
  readonly view   = input.required<PixelTimepickerView>();
  readonly format = input<PixelTimepickerFormat>('12');
  readonly hours  = model<number>(12);
  readonly minutes = model<number>(0);

  /** Emitted when the user finishes selecting (mouseup/touchend). */
  readonly selectionComplete = output<void>();

  private readonly ngZone   = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private readonly hostRef  = inject(ElementRef<HTMLElement>);

  protected readonly isDragging = signal(false);

  // ── Constants exposed to template ──────────────────────────────────────────
  protected readonly DIAL_SIZE = DIAL_SIZE;
  protected readonly CENTER    = CENTER;
  protected readonly ITEM_R    = ITEM_R;

  // ── Dial items ─────────────────────────────────────────────────────────────
  /** Minor tick positions for the minute view (non-label minutes: 1-4, 6-9 …). */
  protected readonly minorTicks = computed(() => {
    if (this.view() !== 'minute') return [];
    const ticks: { index: number; x: number; y: number }[] = [];
    for (let i = 0; i < 60; i++) {
      if (i % 5 !== 0) {
        const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
        ticks.push({ index: i, x: CENTER + OUTER_R * Math.cos(angle), y: CENTER + OUTER_R * Math.sin(angle) });
      }
    }
    return ticks;
  });

  protected readonly dialItems = computed((): readonly DialItem[] => {
    if (this.view() === 'hour') {
      return this.buildHourItems();
    }
    return this.buildMinuteItems();
  });

  // ── Active value ───────────────────────────────────────────────────────────
  protected readonly activeValue = computed(() =>
    this.view() === 'hour' ? this.hours() : this.minutes(),
  );

  // ── Hand end point ─────────────────────────────────────────────────────────
  protected readonly handEnd = computed(() => {
    const active = this.activeValue();
    const is24h  = this.format() === '24';
    let total: number;
    let inner: boolean;

    if (this.view() === 'hour') {
      total = 12;
      inner = is24h && active > 12;
    } else {
      total = 60;
      inner = false;
    }

    const norm  = this.view() === 'hour' ? (is24h ? active % 12 : active % 12) : active;
    const angle = valueToAngle(norm, total);
    const r     = inner ? INNER_R : OUTER_R;
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
  });

  // ── Item builders ───────────────────────────────────────────────────────────
  private buildHourItems(): readonly DialItem[] {
    const is24h  = this.format() === '24';
    const items: DialItem[] = [];

    // Outer ring: 1-12 (or 12 as 0 for 24h)
    for (let i = 1; i <= 12; i++) {
      const value = is24h && i === 12 ? 0 : i;
      const idx   = i % 12; // 12 maps to 0 for angle (top)
      const angle = angleForIndex(idx, 12);
      items.push({
        value,
        label: is24h ? String(value).padStart(2, '0') : String(i),
        x: CENTER + OUTER_R * Math.cos(angle),
        y: CENTER + OUTER_R * Math.sin(angle),
        inner: false,
      });
    }

    // Inner ring for 24h (13-23)
    if (is24h) {
      for (let i = 13; i <= 23; i++) {
        const idx   = (i - 12 - 1);
        const angle = angleForIndex(idx % 12, 12);
        items.push({
          value: i,
          label: String(i),
          x: CENTER + INNER_R * Math.cos(angle),
          y: CENTER + INNER_R * Math.sin(angle),
          inner: true,
        });
      }
    }

    return items;
  }

  private buildMinuteItems(): readonly DialItem[] {
    const items: DialItem[] = [];
    for (let i = 0; i < 60; i += 5) {
      const angle = valueToAngle(i, 60);
      const label = i === 0 ? '00' : String(i);
      items.push({
        value: i,
        label,
        x: CENTER + OUTER_R * Math.cos(angle),
        y: CENTER + OUTER_R * Math.sin(angle),
        inner: false,
      });
    }
    return items;
  }

  // ── Pointer interaction ─────────────────────────────────────────────────────
  /** Arrow keys adjust the active value; Enter/Space confirm selection. */
  protected onDialKeydown(event: KeyboardEvent): void {
    const step = (event.key === 'ArrowUp' || event.key === 'ArrowRight') ? 1 : -1;
    const isNav = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key);

    if (isNav) {
      event.preventDefault();
      if (this.view() === 'hour') {
        const is24 = this.format() === '24';
        const max  = is24 ? 23 : 12;
        const min  = is24 ? 0 : 1;
        const next = this.hours() + step;
        this.hours.set(next > max ? min : next < min ? max : next);
      } else {
        this.minutes.set(((this.minutes() + step) + 60) % 60);
      }
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectionComplete.emit();
    }
  }

  protected onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
    this.updateFromPointer(event);
    this.ngZone.runOutsideAngular(() => {
      const onMove = (e: PointerEvent) => this.ngZone.run(() => this.updateFromPointer(e));
      const onUp   = () => {
        this.ngZone.run(() => {
          this.isDragging.set(false);
          this.selectionComplete.emit();
        });
        this.document.removeEventListener('pointermove', onMove);
        this.document.removeEventListener('pointerup', onUp);
      };
      this.document.addEventListener('pointermove', onMove);
      this.document.addEventListener('pointerup', onUp);
    });
  }

  private updateFromPointer(event: PointerEvent): void {
    const rect    = this.hostRef.nativeElement.getBoundingClientRect();
    const cx      = rect.left + rect.width  / 2;
    const cy      = rect.top  + rect.height / 2;
    const dx      = event.clientX - cx;
    const dy      = event.clientY - cy;
    const dist    = Math.sqrt(dx * dx + dy * dy);
    const radius  = rect.width / 2;

    // Determine inner vs outer ring for 24h hours
    const useInner = this.view() === 'hour' && this.format() === '24' && dist < radius * 0.58;

    const rawAngle = Math.atan2(dy, dx); // radians, 0 = 3 o'clock
    // convert to 0 = 12 o'clock clockwise
    const angle = ((rawAngle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI));

    if (this.view() === 'hour') {
      const total = 12;
      const raw   = Math.round((angle / (2 * Math.PI)) * total);
      const h12   = ((raw % total) + total) % total; // 0-11

      if (this.format() === '12') {
        const h = h12 === 0 ? 12 : h12;
        this.hours.set(h);
      } else {
        // 24h: outer = 1-12/0, inner = 13-23
        if (useInner) {
          const inner = h12 === 0 ? 12 : h12 + 12;
          this.hours.set(inner > 23 ? 13 : inner);
        } else {
          const h = h12 === 0 ? 0 : h12;
          this.hours.set(h);
        }
      }
    } else {
      const total  = 60;
      const raw    = Math.round((angle / (2 * Math.PI)) * total);
      const minute = ((raw % total) + total) % total;
      this.minutes.set(minute);
    }
  }

  // ── Click on specific item ─────────────────────────────────────────────────
  protected onItemClick(value: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.view() === 'hour') {
      this.hours.set(value);
    } else {
      this.minutes.set(value);
    }
    this.selectionComplete.emit();
  }

  protected isActive(item: DialItem): boolean {
    return item.value === this.activeValue();
  }
}
