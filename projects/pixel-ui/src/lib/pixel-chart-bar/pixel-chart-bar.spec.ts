import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelChartBarComponent from './pixel-chart-bar';
import type { PixelChartSeries } from '../pixel-chart/pixel-chart.types';

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function installCanvasStub(): void {
  (HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }).getContext = function (
    this: HTMLCanvasElement,
  ) {
    return {
      canvas: this,
      clearRect: () => undefined,
      fillRect: () => undefined,
      strokeRect: () => undefined,
      fillText: () => undefined,
      strokeText: () => undefined,
      measureText: () => ({ width: 0 }),
      beginPath: () => undefined,
      closePath: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      stroke: () => undefined,
      fill: () => undefined,
      save: () => undefined,
      restore: () => undefined,
      translate: () => undefined,
      scale: () => undefined,
      rotate: () => undefined,
      setTransform: () => undefined,
      createLinearGradient: () => ({ addColorStop: () => undefined }),
      createRadialGradient: () => ({ addColorStop: () => undefined }),
      drawImage: () => undefined,
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => undefined,
      arc: () => undefined,
      rect: () => undefined,
      clip: () => undefined,
    };
  };
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 400,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 280,
  });
}

@Component({
  imports: [PixelChartBarComponent],
  template: `
    <section data-theme="enterprise-light">
      <pixel-chart-bar
        [series]="series()"
        [categories]="categories()"
        [mode]="mode()"
        [orientation]="orientation()"
        [ariaLabel]="ariaLabel()"
      />
    </section>
  `,
})
class HostComponent {
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'A', data: [1, 2, 3] },
  ]);
  readonly categories = signal(['Q1', 'Q2', 'Q3']);
  readonly mode = signal<'grouped' | 'stacked'>('grouped');
  readonly orientation = signal<'vertical' | 'horizontal'>('vertical');
  readonly ariaLabel = signal('Quarterly sales');
}

describe('PixelChartBarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeAll(() => {
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
    installCanvasStub();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('sets mode and orientation data attributes', () => {
    const el = fixture.nativeElement.querySelector('pixel-chart-bar') as HTMLElement;
    expect(el.getAttribute('data-mode')).toBe('grouped');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
  });

  it('reacts to mode and orientation changes', () => {
    fixture.componentInstance.mode.set('stacked');
    fixture.componentInstance.orientation.set('horizontal');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('pixel-chart-bar') as HTMLElement;
    expect(el.getAttribute('data-mode')).toBe('stacked');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('forwards aria-label to the host plot', () => {
    const host = fixture.nativeElement.querySelector('pixel-chart-host') as HTMLElement;
    expect(host.getAttribute('aria-label')).toContain('Quarterly sales');
  });
});
