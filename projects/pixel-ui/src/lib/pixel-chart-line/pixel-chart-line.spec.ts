import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelChartLineComponent from './pixel-chart-line';
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
    const noop = () => undefined;
    return {
      canvas: this,
      clearRect: noop,
      fillRect: noop,
      strokeRect: noop,
      fillText: noop,
      strokeText: noop,
      measureText: () => ({ width: 0 }),
      beginPath: noop,
      closePath: noop,
      moveTo: noop,
      lineTo: noop,
      bezierCurveTo: noop,
      quadraticCurveTo: noop,
      arcTo: noop,
      stroke: noop,
      fill: noop,
      save: noop,
      restore: noop,
      translate: noop,
      scale: noop,
      rotate: noop,
      transform: noop,
      setTransform: noop,
      resetTransform: noop,
      createLinearGradient: () => ({ addColorStop: noop }),
      createRadialGradient: () => ({ addColorStop: noop }),
      createPattern: () => null,
      drawImage: noop,
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: noop,
      arc: noop,
      rect: noop,
      clip: noop,
      isPointInPath: () => false,
      isPointInStroke: () => false,
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
  imports: [PixelChartLineComponent],
  template: `
    <section data-theme="enterprise-light">
      <pixel-chart-line
        [series]="series()"
        [categories]="categories()"
        [mode]="mode()"
        ariaLabel="Sales trend"
      />
    </section>
  `,
})
class HostComponent {
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'A', data: [1, 2, 3] },
  ]);
  readonly categories = signal(['Jan', 'Feb', 'Mar']);
  readonly mode = signal<'straight' | 'smooth' | 'step'>('straight');
}

describe('PixelChartLineComponent', () => {
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

  it('sets data-mode and reacts to mode changes', () => {
    const el = fixture.nativeElement.querySelector('pixel-chart-line') as HTMLElement;
    expect(el.getAttribute('data-mode')).toBe('straight');
    fixture.componentInstance.mode.set('smooth');
    fixture.detectChanges();
    expect(el.getAttribute('data-mode')).toBe('smooth');
  });

  it('forwards aria-label to the host plot', () => {
    const host = fixture.nativeElement.querySelector('pixel-chart-host') as HTMLElement;
    expect(host.getAttribute('aria-label')).toContain('Sales trend');
  });
});
