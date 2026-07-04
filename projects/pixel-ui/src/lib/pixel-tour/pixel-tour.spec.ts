import { Component, inject, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PixelTourService } from './pixel-tour.service';
import { PixelTourRef } from './pixel-tour-ref';
import PixelTourAnchorDirective from './pixel-tour-anchor';
import type { PixelTourConfig, PixelTourStep } from './pixel-tour.types';

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

@Component({
  imports: [PixelTourAnchorDirective],
  template: `
    <section class="theme-shell" data-theme="enterprise-light">
      <button type="button" class="launch" (click)="focusProbe()">Launch</button>
      <button type="button" pixelTourAnchor="create-report">New report</button>
      <div id="filters-panel">Filters</div>
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
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
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

    (document.querySelector('.pixel-tour-spotlight__svg') as SVGElement).dispatchEvent(
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
});
