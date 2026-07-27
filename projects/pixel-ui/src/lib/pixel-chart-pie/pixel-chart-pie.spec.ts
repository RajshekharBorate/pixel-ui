import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelChartPieComponent from './pixel-chart-pie';
import type { PixelChartPieSlice } from '../pixel-chart/builders/pie-option';

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
      setTransform: noop,
      createLinearGradient: () => ({ addColorStop: noop }),
      createRadialGradient: () => ({ addColorStop: noop }),
      drawImage: noop,
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: noop,
      arc: noop,
      rect: noop,
      clip: noop,
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
  imports: [PixelChartPieComponent],
  template: `
    <section data-theme="enterprise-light">
      <pixel-chart-pie [slices]="slices()" [mode]="mode()" ariaLabel="Share" />
    </section>
  `,
})
class HostComponent {
  readonly slices = signal<readonly PixelChartPieSlice[]>([
    { id: 'a', name: 'A', value: 40 },
    { id: 'b', name: 'B', value: 60 },
  ]);
  readonly mode = signal<'pie' | 'donut' | 'semi'>('pie');
}

describe('PixelChartPieComponent', () => {
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

  it('sets data-mode', () => {
    const el = fixture.nativeElement.querySelector('pixel-chart-pie') as HTMLElement;
    expect(el.getAttribute('data-mode')).toBe('pie');
    fixture.componentInstance.mode.set('donut');
    fixture.detectChanges();
    expect(el.getAttribute('data-mode')).toBe('donut');
  });
});
