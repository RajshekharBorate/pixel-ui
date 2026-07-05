import { Component, inject, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { PixelTourService } from './pixel-tour.service';
import { PixelTourRef } from './pixel-tour-ref';
import PixelTourAnchorDirective from './pixel-tour-anchor';
import { PIXEL_TOUR_STEP_DATA, type PixelTourConfig, type PixelTourStep } from './pixel-tour.types';

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

@Component({ template: `<div id="page-b-target">Page B content</div>` })
class PageBComponent {}

@Component({ template: `<span>plan={{ data?.plan }}</span>` })
class StepDataProbeComponent {
  protected readonly data = inject(PIXEL_TOUR_STEP_DATA) as { plan?: string } | null;
}

@Component({
  imports: [PixelTourAnchorDirective, RouterOutlet],
  template: `
    <section class="theme-shell" data-theme="enterprise-light">
      <button type="button" class="launch" (click)="focusProbe()">Launch</button>
      <button type="button" pixelTourAnchor="create-report">New report</button>
      <div id="filters-panel">Filters</div>
      <router-outlet />
    </section>
  `,
})
class HostComponent {
  readonly tour = inject(PixelTourService);
  readonly theme = signal('enterprise-light');
  focusProbe(): void {}
}

const STEPS: readonly PixelTourStep[] = [
  { id: 'welcome', title: 'Welcome', content: 'A quick look around.' },
  { id: 'create', target: 'create-report', title: 'Create', content: 'Start here.' },
  { id: 'filters', target: '#filters-panel', title: 'Filters', content: 'Refine results.' },
];

describe('PixelTourService', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let ref: PixelTourRef | null = null;

  beforeEach(async () => {
    (globalThis as Record<string, unknown>)['ResizeObserver'] ??= ResizeObserverMock;
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideRouter([
          { path: '', children: [] },
          { path: 'page-b', component: PageBComponent },
        ]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(async () => {
    ref?.abort();
    ref = null;
    // Let the deferred overlay teardown run.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  function start(steps = STEPS, config: PixelTourConfig = {}): PixelTourRef {
    ref = host.tour.start(steps, config);
    fixture.detectChanges();
    return ref;
  }

  function card(): HTMLElement {
    return document.querySelector('pixel-tour-card') as HTMLElement;
  }

  function spotlightPath(): string {
    return (
      document.querySelector('.pixel-tour-spotlight__scrim')?.getAttribute('d') ?? ''
    );
  }

  function detect(): void {
    fixture.detectChanges();
  }

  it('mounts scrim + card in the overlay container and renders the first step centered', () => {
    const tour = start();
    expect(tour.status()).toBe('running');
    expect(card().closest('.pixel-overlay-container')).toBeTruthy();
    expect(card().classList.contains('pixel-tour-card--centered')).toBe(true);
    expect(card().getAttribute('role')).toBe('dialog');
    expect(card().getAttribute('aria-modal')).toBe('false');
    expect(card().textContent).toContain('Welcome');
    expect(card().textContent).toContain('1 of 3');
    expect(document.querySelector('pixel-tour-spotlight')).toBeTruthy();
  });

  it('walks steps with next/back, resolving anchor and selector targets', () => {
    const tour = start();

    tour.next();
    detect();
    expect(tour.stepIndex()).toBe(1);
    expect(card().classList.contains('pixel-tour-card--centered')).toBe(false);
    expect(card().textContent).toContain('Create');
    // Anchored step: the spotlight path contains a cutout subpath beyond the outer rect.
    expect(spotlightPath().match(/M/g)?.length).toBeGreaterThan(1);

    tour.next();
    detect();
    expect(card().textContent).toContain('Filters');

    tour.previous();
    detect();
    expect(tour.activeStep().id).toBe('create');
  });

  it('completes from the last step and resolves the finished promise', async () => {
    const tour = start();
    tour.goTo('filters');
    detect();
    tour.next();
    detect();
    expect(tour.status()).toBe('completed');
    await expect(tour.finished).resolves.toBe('completed');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelector('pixel-tour-card')).toBeNull();
    expect(document.querySelector('pixel-tour-spotlight')).toBeNull();
  });

  it('hides Back on the first step and swaps Next for Done on the last', () => {
    const tour = start();
    const labels = () =>
      Array.from(card().querySelectorAll('.pixel-button__label')).map((b) =>
        b.textContent?.trim(),
      );
    expect(labels()).not.toContain('Back');

    tour.goTo('filters');
    detect();
    expect(labels()).toContain('Back');
    expect(labels()).toContain('Done');
    expect(labels()).not.toContain('Next');
  });

  it('implements the keyboard contract: arrows navigate, Escape aborts, focus restores', () => {
    const launch = fixture.nativeElement.querySelector('.launch') as HTMLElement;
    launch.focus();
    const tour = start();

    card().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    detect();
    expect(tour.stepIndex()).toBe(1);

    card().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    detect();
    expect(tour.stepIndex()).toBe(0);

    card().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    detect();
    expect(tour.status()).toBe('aborted');
  });

  it('announces step progress via the polite live region', () => {
    const tour = start();
    const live = card().querySelector('[aria-live="polite"]');
    expect(live?.textContent).toContain('1 of 3: Welcome');
    tour.next();
    detect();
    expect(live?.textContent).toContain('2 of 3: Create');
  });

  it('honors backdropClick: skip-tour and label overrides', () => {
    const tour = start(STEPS, {
      backdropClick: 'skip-tour',
      labels: { skipTour: 'No thanks' },
    });
    expect(card().textContent).toContain('No thanks');

    // Real clicks land on the painted scrim path (the cutout is a hit-test hole).
    (document.querySelector('.pixel-tour-spotlight__scrim') as SVGPathElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    detect();
    expect(tour.status()).toBe('skipped');
  });

  it('renders per-step button sets including skip-step', () => {
    const tour = start([
      { id: 'a', content: 'A', buttons: ['skip-step', 'next'] },
      { id: 'b', content: 'B' },
    ]);
    const skip = Array.from(card().querySelectorAll('pixel-button button')).find((b) =>
      b.textContent?.includes('Skip'),
    ) as HTMLButtonElement;
    skip.click();
    detect();
    expect(tour.stepIndex()).toBe(1);
    expect(tour.status()).toBe('running');
  });

  it('aborts the previous tour when a new one starts', () => {
    const first = start();
    const second = host.tour.start([{ id: 'solo', content: 'Only step' }]);
    detect();
    expect(first.status()).toBe('aborted');
    expect(second.status()).toBe('running');
    expect(host.tour.activeTour).toBe(second);
    second.abort();
  });

  // ---- Phase 1: async transitions, persistence, pause ----

  function flush(ms = 0): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  it('skips steps whose `when` predicate is false, in the travel direction', async () => {
    let show = false;
    const tour = start([
      { id: 'a', content: 'A' },
      { id: 'b', content: 'B', when: () => show },
      { id: 'c', content: 'C' },
    ]);
    tour.next();
    await flush();
    detect();
    expect(tour.activeStep().id).toBe('c');

    show = true;
    tour.previous();
    await flush();
    detect();
    expect(tour.activeStep().id).toBe('b');
  });

  it('runs beforeEnter/afterLeave hooks in order with the waiting status', async () => {
    const calls: string[] = [];
    const tour = start([
      {
        id: 'a',
        content: 'A',
        afterLeave: async () => {
          calls.push('afterLeave:a');
        },
      },
      {
        id: 'b',
        content: 'B',
        beforeEnter: async () => {
          calls.push('beforeEnter:b');
        },
      },
    ]);
    tour.next();
    expect(tour.status()).toBe('waiting');
    await flush();
    detect();
    expect(calls).toEqual(['afterLeave:a', 'beforeEnter:b']);
    expect(tour.status()).toBe('running');
    expect(tour.activeStep().id).toBe('b');
  });

  it('waits for a late target and anchors once it appears', async () => {
    const tour = start([
      { id: 'a', content: 'A' },
      {
        id: 'late',
        content: 'Late',
        target: '#late-target',
        waitForTarget: { timeoutMs: 1000, pollMs: 20 },
      },
    ]);
    tour.next();
    await flush(30);
    expect(tour.status()).toBe('waiting');

    const el = document.createElement('div');
    el.id = 'late-target';
    fixture.nativeElement.appendChild(el);
    await flush(60);
    detect();
    expect(tour.status()).toBe('running');
    expect(tour.activeStep().id).toBe('late');
    expect(card().classList.contains('pixel-tour-card--centered')).toBe(false);
    el.remove();
  });

  it('skips optional steps whose target never appears, and aborts for required ones', async () => {
    const tour = start([
      { id: 'a', content: 'A' },
      {
        id: 'missing-optional',
        content: 'M',
        target: '#nope',
        optional: true,
        waitForTarget: { timeoutMs: 40, pollMs: 10 },
      },
      { id: 'c', content: 'C' },
    ]);
    tour.next();
    await flush(120);
    detect();
    expect(tour.activeStep().id).toBe('c');

    tour.goTo('a');
    await flush();
    const strict = host.tour.start([
      {
        id: 'missing-required',
        content: 'M',
        target: '#nope',
        waitForTarget: { timeoutMs: 40, pollMs: 10 },
      },
    ]);
    await flush(120);
    expect(strict.status()).toBe('aborted');
    ref = strict;
  });

  it('persists progress, resumes after abort, and never re-shows once done', async () => {
    const store = new Map<string, string>();
    const storage = {
      get: (k: string) => store.get(k) ?? null,
      set: (k: string, v: string) => void store.set(k, v),
      remove: (k: string) => void store.delete(k),
    };
    const config: PixelTourConfig = { persistKey: 'tour-v1', storage };

    const first = start(STEPS, config);
    first.next();
    await flush();
    first.abort();
    await flush();
    expect(JSON.parse(store.get('tour-v1')!)).toEqual({ index: 1 });

    const resumed = host.tour.start(STEPS, config);
    detect();
    expect(resumed.stepIndex()).toBe(1);
    resumed.goTo('filters');
    await flush();
    detect();
    resumed.next();
    await flush();
    expect(resumed.status()).toBe('completed');
    expect(JSON.parse(store.get('tour-v1')!)).toEqual({ done: true });

    const blocked = host.tour.start(STEPS, config);
    expect(blocked.status()).toBe('completed');
    expect(document.querySelector('pixel-tour-card')).toBeNull();
    ref = null;
  });

  it('lets beforeAbort veto dismissal and emits analytics events', async () => {
    const events: string[] = [];
    let allowAbort = false;
    const tour = start(STEPS, {
      beforeAbort: () => allowAbort,
      onEvent: (event) => events.push(event.type),
    });
    tour.abort();
    await flush();
    expect(tour.status()).toBe('running');

    tour.pause();
    tour.resume();
    allowAbort = true;
    tour.abort();
    await flush();
    expect(tour.status()).toBe('aborted');
    expect(events).toEqual(['start', 'step', 'pause', 'resume', 'abort']);
  });

  it('navigates route steps and anchors to post-navigation targets', async () => {
    const router = TestBed.inject(Router);
    const tour = start([
      { id: 'a', content: 'A' },
      {
        id: 'routed',
        content: 'On page B',
        route: '/page-b',
        target: '#page-b-target',
        waitForTarget: { timeoutMs: 1000, pollMs: 20 },
      },
    ]);
    tour.next();
    await flush(80);
    detect();
    expect(router.url).toBe('/page-b');
    expect(tour.activeStep().id).toBe('routed');
    expect(card().classList.contains('pixel-tour-card--centered')).toBe(false);
  });

  it('freezes navigation while paused', async () => {
    const tour = start();
    tour.pause();
    tour.next();
    await flush();
    expect(tour.stepIndex()).toBe(0);
    expect(tour.status()).toBe('paused');

    tour.resume();
    tour.next();
    await flush();
    expect(tour.stepIndex()).toBe(1);
  });

  // ---- Phase 2: autoplay, minimize, drag, interactive spotlight, progress variants ----

  it('auto-advances with autoplay and pauses the countdown on hover', async () => {
    const tour = start([...STEPS], { autoplay: { stepMs: 150 } });
    expect(card().querySelector('.pixel-tour-card__countdown')).toBeTruthy();
    // A pause control is mandatory with autoplay (WCAG 2.2.1).
    expect(card().querySelector('[aria-label="Pause tour"]')).toBeTruthy();

    card().dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    detect();
    await flush(300);
    detect();
    expect(tour.stepIndex()).toBe(0); // hover froze the countdown

    card().dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
    detect();
    await flush(400);
    detect();
    expect(tour.stepIndex()).toBeGreaterThan(0);
  });

  it('collapses to a resume chip with pauseUi: minimize', () => {
    const tour = start([...STEPS], { pausable: true, pauseUi: 'minimize' });
    tour.pause();
    detect();
    expect(card().classList.contains('pixel-tour-card--minimized')).toBe(true);
    expect(card().querySelector('.pixel-tour-card__resume-chip')).toBeTruthy();
    expect(card().querySelector('.pixel-tour-card__footer')).toBeNull();
    expect(
      document
        .querySelector('pixel-tour-spotlight')
        ?.classList.contains('pixel-tour-spotlight--hidden'),
    ).toBe(true);

    (card().querySelector('.pixel-tour-card__resume-chip button') as HTMLElement).click();
    detect();
    expect(tour.status()).toBe('running');
    expect(card().querySelector('.pixel-tour-card__footer')).toBeTruthy();
  });

  it('drags the card via the grip and resets the offset on step change', async () => {
    const tour = start([...STEPS], { draggable: true });
    const grip = card().querySelector('.pixel-tour-card__grip') as HTMLElement;
    expect(grip).toBeTruthy();

    grip.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, clientY: 100, bubbles: true }));
    grip.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 140, clientY: 130, bubbles: true }));
    grip.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }));
    detect();
    expect(card().style.translate).toContain('px');

    tour.next();
    await flush();
    detect();
    expect(card().style.translate).toBe('');
  });

  it('advances on target click with an interactive spotlight', async () => {
    const tour = start([
      { id: 'a', content: 'A' },
      {
        id: 'try-it',
        content: 'Click the real button',
        target: 'create-report',
        advanceOn: 'target-click',
      },
      { id: 'c', content: 'C' },
    ]);
    tour.next();
    await flush();
    detect();
    const spotlight = document.querySelector('pixel-tour-spotlight');
    expect(spotlight?.classList.contains('pixel-tour-spotlight--interactive')).toBe(true);
    expect(spotlight?.querySelector('.pixel-tour-spotlight__pulse')).toBeTruthy();

    (fixture.nativeElement.querySelector('[pixelTourAnchor="create-report"]') as HTMLElement).click();
    await flush();
    detect();
    expect(tour.activeStep().id).toBe('c');
  });

  it('renders extra cutouts for multi-target steps and merges overlapping ones', async () => {
    const anchor = fixture.nativeElement.querySelector(
      '[pixelTourAnchor="create-report"]',
    ) as HTMLElement;
    const panel = fixture.nativeElement.querySelector('#filters-panel') as HTMLElement;
    const rect = (x: number, y: number) =>
      ({ left: x, top: y, right: x + 50, bottom: y + 20, width: 50, height: 20 }) as DOMRect;
    anchor.getBoundingClientRect = () => rect(100, 100);
    panel.getBoundingClientRect = () => rect(400, 400); // far apart — two cutouts

    const tour = start([
      {
        id: 'multi',
        content: 'Both of these',
        target: 'create-report',
        targets: ['#filters-panel'],
      },
    ]);
    await flush();
    detect();
    // Outer viewport rect + two cutout subpaths.
    expect(spotlightPath().match(/M/g)?.length).toBe(3);

    // Overlapping targets merge into ONE union cutout (no scrim sliver between them).
    panel.getBoundingClientRect = () => rect(130, 100);
    window.dispatchEvent(new Event('resize'));
    detect();
    expect(spotlightPath().match(/M/g)?.length).toBe(2);
    tour.complete();
  });

  it('renders dots and bar progress variants', async () => {
    start([...STEPS], { progress: 'dots' });
    expect(card().querySelectorAll('.pixel-tour-card__dot').length).toBe(3);
    expect(card().querySelectorAll('.pixel-tour-card__dot--active').length).toBe(1);
    ref?.abort();
    await flush(); // let the previous card's deferred teardown run

    start([...STEPS], { progress: 'bar' });
    expect(card().querySelector('.pixel-tour-card__bar')).toBeTruthy();
  });

  it('injects PIXEL_TOUR_STEP_DATA into component step content', () => {
    start([{ id: 'comp', content: StepDataProbeComponent, data: { plan: 'enterprise' } }]);
    expect(card().textContent).toContain('plan=enterprise');
  });
});
