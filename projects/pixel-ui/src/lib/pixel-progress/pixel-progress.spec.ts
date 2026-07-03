import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelProgressBarComponent from './pixel-progress-bar';
import PixelProgressCircleComponent from './pixel-progress-circle';
import {
  clampProgressValue,
  formatProgressBytes,
  formatProgressDuration,
  resolveThresholdStatus,
  toProgressPercent,
  type PixelProgressChangeEvent,
  type PixelProgressCompleteEvent,
  type PixelProgressMode,
  type PixelProgressSegment,
  type PixelProgressStatus,
  type PixelProgressThreshold,
} from './pixel-progress.types';

/* -------------------------------------------------------------------------- */
/*  Pure helpers                                                              */
/* -------------------------------------------------------------------------- */

describe('pixel-progress helpers', () => {
  it('clamps values to the range', () => {
    expect(clampProgressValue(150, 0, 100)).toBe(100);
    expect(clampProgressValue(-10, 0, 100)).toBe(0);
    expect(clampProgressValue(42, 0, 100)).toBe(42);
    expect(clampProgressValue(Number.NaN, 0, 100)).toBe(0);
  });

  it('computes percentage within a custom range', () => {
    expect(toProgressPercent(50, 0, 100)).toBe(50);
    expect(toProgressPercent(15, 10, 20)).toBe(50);
    expect(toProgressPercent(5, 10, 10)).toBe(0); // zero span guard
  });

  it('resolves the highest matching threshold band', () => {
    const thresholds: PixelProgressThreshold[] = [
      { from: 0, status: 'success' },
      { from: 61, status: 'warning' },
      { from: 81, status: 'error' },
    ];
    expect(resolveThresholdStatus(40, thresholds)?.status).toBe('success');
    expect(resolveThresholdStatus(70, thresholds)?.status).toBe('warning');
    expect(resolveThresholdStatus(95, thresholds)?.status).toBe('error');
    expect(resolveThresholdStatus(50, [])).toBeNull();
  });

  it('formats bytes and durations', () => {
    expect(formatProgressBytes(0)).toBe('0 B');
    expect(formatProgressBytes(1024)).toBe('1.0 KB');
    expect(formatProgressBytes(2_621_440)).toBe('2.5 MB');
    expect(formatProgressDuration(45)).toBe('45s');
    expect(formatProgressDuration(125)).toBe('2m 05s');
    expect(formatProgressDuration(-1)).toBe('—');
  });
});

/* -------------------------------------------------------------------------- */
/*  Progress bar                                                              */
/* -------------------------------------------------------------------------- */

@Component({
  standalone: true,
  imports: [PixelProgressBarComponent],
  template: `
    <section [attr.data-theme]="theme()">
      <pixel-progress-bar
        #bar
        [value]="value()"
        [min]="min()"
        [max]="max()"
        [mode]="mode()"
        [buffer]="buffer()"
        [status]="status()"
        [thresholds]="thresholds()"
        [segments]="segments()"
        [showPercentage]="true"
        [showMilestones]="showMilestones()"
        [milestones]="milestones()"
        (completed)="lastComplete.set($event)"
        (valueChange)="lastChange.set($event)"
        (statusChange)="lastStatus.set($event)"
      />
    </section>
  `,
})
class BarHostComponent {
  readonly bar = viewChild.required<PixelProgressBarComponent>('bar');
  readonly theme = signal<'light' | 'dark'>('light');
  readonly value = signal(40);
  readonly min = signal(0);
  readonly max = signal(100);
  readonly mode = signal<PixelProgressMode>('determinate');
  readonly buffer = signal(0);
  readonly status = signal<PixelProgressStatus>('default');
  readonly thresholds = signal<PixelProgressThreshold[]>([]);
  readonly segments = signal<PixelProgressSegment[]>([]);
  readonly showMilestones = signal(false);
  readonly milestones = signal([{ at: 50 }, { at: 75 }]);

  readonly lastComplete = signal<PixelProgressCompleteEvent | null>(null);
  readonly lastChange = signal<PixelProgressChangeEvent | null>(null);
  readonly lastStatus = signal<PixelProgressStatus | null>(null);
}

describe('PixelProgressBarComponent', () => {
  let fixture: ComponentFixture<BarHostComponent>;
  let host: BarHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BarHostComponent] });
    fixture = TestBed.createComponent(BarHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function trackEl(): HTMLElement {
    return fixture.nativeElement.querySelector('.pixel-progress__track');
  }

  it('renders with progressbar role and ARIA attributes', () => {
    const track = trackEl();
    expect(track.getAttribute('role')).toBe('progressbar');
    expect(track.getAttribute('aria-valuemin')).toBe('0');
    expect(track.getAttribute('aria-valuemax')).toBe('100');
    expect(track.getAttribute('aria-valuenow')).toBe('40');
    expect(track.getAttribute('aria-valuetext')).toContain('40 percent');
  });

  it('computes percentage and renders it', () => {
    expect(host.bar().percentage()).toBe(40);
    const pct = fixture.nativeElement.querySelector('.pixel-progress__percentage');
    expect(pct.textContent?.trim()).toBe('40%');
  });

  it('computes percentage within a custom range', () => {
    host.min.set(0);
    host.max.set(50);
    host.value.set(25);
    fixture.detectChanges();
    expect(host.bar().percentage()).toBe(50);
  });

  it('emits valueChange on programmatic update', () => {
    host.bar().setValue(80);
    fixture.detectChanges();
    expect(host.lastChange()?.value).toBe(80);
    expect(host.lastChange()?.percentage).toBe(80);
  });

  it('fires completed when reaching 100%', () => {
    host.value.set(100);
    fixture.detectChanges();
    expect(host.lastComplete()).not.toBeNull();
    expect(host.lastComplete()?.percentage).toBe(100);
    expect(host.bar().resolvedStatus()).toBe('completed');
  });

  it('derives status from thresholds', () => {
    host.thresholds.set([
      { from: 0, status: 'success' },
      { from: 61, status: 'warning' },
      { from: 81, status: 'error' },
    ]);
    host.value.set(70);
    fixture.detectChanges();
    expect(host.bar().resolvedStatus()).toBe('warning');
    expect(host.lastStatus()).toBe('warning');
  });

  it('supports indeterminate mode (no aria-valuenow)', () => {
    host.mode.set('indeterminate');
    fixture.detectChanges();
    expect(host.bar().isIndeterminate()).toBe(true);
    expect(trackEl().getAttribute('aria-valuenow')).toBeNull();
    expect(trackEl().getAttribute('aria-busy')).toBe('true');
  });

  it('renders a buffer bar in buffer mode', () => {
    host.mode.set('buffer');
    host.buffer.set(65);
    fixture.detectChanges();
    const buffer = fixture.nativeElement.querySelector('.pixel-progress__buffer');
    expect(buffer).not.toBeNull();
    expect(host.bar().bufferPercent()).toBe(65);
  });

  it('renders multi-segment slices with cumulative offsets', () => {
    host.segments.set([
      { label: 'Docs', value: 30 },
      { label: 'Media', value: 20 },
    ]);
    fixture.detectChanges();
    const segments = fixture.nativeElement.querySelectorAll('.pixel-progress__segment');
    expect(segments.length).toBe(2);
    const views = host.bar().segmentViews();
    expect(views[0].percent).toBe(30);
    expect(views[1].offset).toBe(30);
  });

  it('renders milestone markers with reached state', () => {
    host.showMilestones.set(true);
    host.value.set(60);
    fixture.detectChanges();
    const markers = fixture.nativeElement.querySelectorAll('.pixel-progress__milestone');
    expect(markers.length).toBe(2);
    const reached = host.bar().milestoneViews();
    expect(reached[0].reached).toBe(true); // 50 <= 60
    expect(reached[1].reached).toBe(false); // 75 > 60
  });

  it('clamps out-of-range values', () => {
    host.bar().setValue(500);
    fixture.detectChanges();
    expect(host.bar().clampedValue()).toBe(100);
  });

  it('increments and resets via the public API', () => {
    host.bar().increment(10);
    fixture.detectChanges();
    expect(host.bar().clampedValue()).toBe(50);
    host.bar().reset();
    fixture.detectChanges();
    expect(host.bar().clampedValue()).toBe(40);
  });
});

/* -------------------------------------------------------------------------- */
/*  Circular progress                                                         */
/* -------------------------------------------------------------------------- */

@Component({
  standalone: true,
  imports: [PixelProgressCircleComponent],
  template: `
    <pixel-progress-circle
      #circle
      [value]="value()"
      [strokeWidth]="strokeWidth()"
      [indeterminate]="indeterminate()"
      [showPercentage]="true"
    />
  `,
})
class CircleHostComponent {
  readonly circle = viewChild.required<PixelProgressCircleComponent>('circle');
  readonly value = signal(75);
  readonly strokeWidth = signal(8);
  readonly indeterminate = signal(false);
}

describe('PixelProgressCircleComponent', () => {
  let fixture: ComponentFixture<CircleHostComponent>;
  let host: CircleHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CircleHostComponent] });
    fixture = TestBed.createComponent(CircleHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders an SVG progressbar with ARIA values', () => {
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('role')).toBe('progressbar');
    expect(svg.getAttribute('aria-valuenow')).toBe('75');
  });

  it('computes circumference and dash offset', () => {
    const circumference = host.circle().circumference();
    expect(circumference).toBeGreaterThan(0);
    // 75% filled → 25% of circumference remains as offset.
    expect(host.circle().dashOffset()).toBeCloseTo(circumference * 0.25, 5);
  });

  it('renders the percentage label', () => {
    const label = fixture.nativeElement.querySelector('.pixel-progress-circle__percentage');
    expect(label.textContent?.trim()).toBe('75%');
  });

  it('marks status completed at 100%', () => {
    host.value.set(100);
    fixture.detectChanges();
    expect(host.circle().resolvedStatus()).toBe('completed');
    expect(host.circle().dashOffset()).toBeCloseTo(0, 5);
  });

  it('drops aria-valuenow when indeterminate', () => {
    host.indeterminate.set(true);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-valuenow')).toBeNull();
    expect(svg.getAttribute('aria-busy')).toBe('true');
  });
});
