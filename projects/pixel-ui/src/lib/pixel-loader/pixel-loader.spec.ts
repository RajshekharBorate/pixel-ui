import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PixelLoaderComponent from './pixel-loader';
import PixelSkeletonComponent from './pixel-skeleton';
import PixelLoadingContainerComponent from './pixel-loading-container';
import { PixelLoadingService } from './pixel-loading.service';
import { clampPercent, smartLoaderType, type PixelLoaderType } from './pixel-loader.types';

/* -------------------------------------------------------------------------- */
/*  Pure helpers                                                              */
/* -------------------------------------------------------------------------- */

describe('pixel-loader helpers', () => {
  it('clamps percentages to 0–100 and guards NaN', () => {
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(-20)).toBe(0);
    expect(clampPercent(42)).toBe(42);
    expect(clampPercent(Number.NaN)).toBe(0);
  });

  it('picks a smart loader type for the work shape', () => {
    expect(smartLoaderType({ determinate: true })).toBe('spinner');
    expect(smartLoaderType({ page: true })).toBe('skeleton');
    expect(smartLoaderType({})).toBe('spinner');
  });
});

/* -------------------------------------------------------------------------- */
/*  PixelLoaderComponent                                                      */
/* -------------------------------------------------------------------------- */

@Component({
  standalone: true,
  imports: [PixelLoaderComponent],
  template: `
    <pixel-loader
      [loading]="loading()"
      [type]="type()"
      [text]="text()"
      [showDelay]="showDelay()"
      [minDuration]="minDuration()"
    />
  `,
})
class LoaderHost {
  readonly loading = signal(true);
  readonly type = signal<PixelLoaderType>('spinner');
  readonly text = signal('Loading…');
  readonly showDelay = signal(0);
  readonly minDuration = signal(0);
}

describe('PixelLoaderComponent', () => {
  let fixture: ComponentFixture<LoaderHost>;
  let host: LoaderHost;

  const el = () => fixture.nativeElement.querySelector('pixel-loader') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoaderHost] }).compileComponents();
    fixture = TestBed.createComponent(LoaderHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the loader with role=status and a spinner', () => {
    const loader = el();
    expect(loader.getAttribute('role')).toBe('status');
    expect(loader.querySelector('.pixel-loader__spinner')).toBeTruthy();
    expect(loader.textContent).toContain('Loading…');
  });

  it('sets data attributes from inputs', () => {
    host.type.set('dots');
    fixture.detectChanges();
    expect(el().getAttribute('data-type')).toBe('dots');
    expect(el().querySelectorAll('.pixel-loader__dot').length).toBe(3);
  });

  it('sets aria-busy while loading and clears it when idle', () => {
    expect(el().getAttribute('aria-busy')).toBe('true');
    host.loading.set(false);
    fixture.detectChanges();
    expect(el().getAttribute('aria-busy')).toBe('false');
  });

  it('honors showDelay before becoming visible', () => {
    vi.useFakeTimers();
    host.loading.set(false);
    fixture.detectChanges();
    host.showDelay.set(300);
    host.loading.set(true);
    fixture.detectChanges();
    expect(el().querySelector('.pixel-loader__inner')).toBeNull();
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(el().querySelector('.pixel-loader__inner')).toBeTruthy();
  });

  it('honors minDuration before hiding', () => {
    vi.useFakeTimers();
    host.minDuration.set(500);
    host.loading.set(false);
    fixture.detectChanges();
    host.loading.set(true);
    fixture.detectChanges();
    expect(el().querySelector('.pixel-loader__inner')).toBeTruthy();
    host.loading.set(false);
    fixture.detectChanges();
    expect(el().querySelector('.pixel-loader__inner')).toBeTruthy();
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    expect(el().querySelector('.pixel-loader__inner')).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  PixelSkeletonComponent                                                    */
/* -------------------------------------------------------------------------- */

@Component({
  standalone: true,
  imports: [PixelSkeletonComponent],
  template: `<pixel-skeleton [preset]="preset()" [rows]="rows()" [columns]="columns()" />`,
})
class SkeletonHost {
  readonly preset = signal<'text' | 'card' | 'table' | 'form'>('text');
  readonly rows = signal(3);
  readonly columns = signal(4);
}

describe('PixelSkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonHost>;
  let host: SkeletonHost;
  const el = () => fixture.nativeElement.querySelector('pixel-skeleton') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SkeletonHost] }).compileComponents();
    fixture = TestBed.createComponent(SkeletonHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders text skeleton lines and is hidden from assistive tech', () => {
    expect(el().getAttribute('aria-hidden')).toBe('true');
    expect(el().querySelectorAll('.pixel-skeleton__block').length).toBe(3);
  });

  it('renders a table preset with rows × columns', () => {
    host.preset.set('table');
    host.rows.set(3);
    host.columns.set(4);
    fixture.detectChanges();
    const rows = el().querySelectorAll('.pixel-skeleton__table-row');
    expect(rows.length).toBe(3);
    expect(rows[0].querySelectorAll('.pixel-skeleton__block').length).toBe(4);
  });

  it('renders a card preset', () => {
    host.preset.set('card');
    fixture.detectChanges();
    expect(el().querySelector('.pixel-skeleton__card')).toBeTruthy();
  });
});

/* -------------------------------------------------------------------------- */
/*  PixelLoadingContainerComponent                                            */
/* -------------------------------------------------------------------------- */

@Component({
  standalone: true,
  imports: [PixelLoadingContainerComponent],
  template: `
    <pixel-loading-container [loading]="loading()" [scope]="scope()" text="Loading">
      <p class="content">Hello</p>
    </pixel-loading-container>
  `,
})
class ContainerHost {
  readonly loading = signal(false);
  readonly scope = signal<'section' | 'fullscreen'>('section');
}

describe('PixelLoadingContainerComponent', () => {
  let fixture: ComponentFixture<ContainerHost>;
  let host: ContainerHost;
  const el = () => fixture.nativeElement.querySelector('pixel-loading-container') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ContainerHost] }).compileComponents();
    fixture = TestBed.createComponent(ContainerHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('projects content and shows no backdrop when idle', () => {
    expect(el().querySelector('.content')?.textContent).toBe('Hello');
    expect(el().querySelector('.pixel-loading-container__backdrop')).toBeNull();
  });

  it('shows an overlay loader when loading', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(el().querySelector('.pixel-loading-container__backdrop')).toBeTruthy();
    expect(el().querySelector('pixel-loader')).toBeTruthy();
    expect(el().classList.contains('pixel-loading-container--active')).toBe(true);
  });

  it('locks body scroll for a fullscreen overlay and restores it', () => {
    host.scope.set('fullscreen');
    host.loading.set(true);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');
    host.loading.set(false);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('');
  });
});

/* -------------------------------------------------------------------------- */
/*  PixelLoadingService                                                       */
/* -------------------------------------------------------------------------- */

describe('PixelLoadingService', () => {
  let service: PixelLoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PixelLoadingService);
  });

  it('tracks active state and count across concurrent tasks', () => {
    expect(service.active()).toBe(false);
    const a = service.start({ message: 'A' });
    const b = service.start({ message: 'B' });
    expect(service.active()).toBe(true);
    expect(service.count()).toBe(2);
    service.stop(a);
    expect(service.count()).toBe(1);
    service.stop(b);
    expect(service.active()).toBe(false);
  });

  it('reference-counts duplicate ids', () => {
    service.start({}, 'dup');
    service.start({}, 'dup');
    expect(service.count()).toBe(1);
    service.stop('dup');
    expect(service.active()).toBe(true);
    service.stop('dup');
    expect(service.active()).toBe(false);
  });

  it('aggregates determinate progress and ignores indeterminate tasks', () => {
    service.start({ progress: 40 }, 'p1');
    service.start({ progress: 80 }, 'p2');
    expect(service.progress()).toBe(60);
    service.start({}, 'indeterminate');
    expect(service.progress()).toBe(60);
    service.setProgress('p1', 100);
    expect(service.progress()).toBe(90);
  });

  it('reports per-scope loading', () => {
    service.start({ scope: 'upload' }, 'u1');
    expect(service.isLoading('upload')).toBe(true);
    expect(service.isLoading('http')).toBe(false);
    service.stop('u1');
    expect(service.isLoading('upload')).toBe(false);
  });

  it('auto start/stop via track() on resolve and reject', async () => {
    await service.track(Promise.resolve('ok'));
    expect(service.active()).toBe(false);
    await expect(service.track(Promise.reject(new Error('x')))).rejects.toThrow('x');
    expect(service.active()).toBe(false);
  });

  it('fires the analytics hook with snapshots', () => {
    const snapshots: number[] = [];
    service.onChange((s) => snapshots.push(s.count));
    const id = service.start({});
    service.stop(id);
    expect(snapshots).toEqual([1, 0]);
  });

  it('reset() clears all tasks', () => {
    service.start({}, 'a');
    service.start({}, 'b');
    service.reset();
    expect(service.active()).toBe(false);
  });
});
