import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelChartBubbleComponent from './pixel-chart-bubble';
import type { PixelChartBubbleSeries } from '../pixel-chart/builders/bubble-option';

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
    get: () => 320,
  });
}

@Component({
  imports: [PixelChartBubbleComponent],
  template: `
    <section data-theme="enterprise-light">
      <pixel-chart-bubble [series]="series()" ariaLabel="Bubbles" />
    </section>
  `,
})
class HostComponent {
  readonly series = signal<readonly PixelChartBubbleSeries[]>([
    {
      id: 'a',
      name: 'A',
      data: [
        { x: 1, y: 2, size: 10, label: 'p1' },
        { x: 2, y: 3, size: 20, label: 'p2' },
      ],
    },
  ]);
}

describe('PixelChartBubbleComponent', () => {
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

  it('renders the chart host', () => {
    const el = fixture.nativeElement.querySelector('pixel-chart-bubble') as HTMLElement;
    expect(el.querySelector('pixel-chart-host')).toBeTruthy();
  });
});
