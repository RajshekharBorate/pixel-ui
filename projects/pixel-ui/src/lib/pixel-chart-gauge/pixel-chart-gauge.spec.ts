import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelChartGaugeComponent from './pixel-chart-gauge';
import type { PixelChartGaugeVariant } from '../pixel-chart/builders/gauge-option';

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
    get: () => 220,
  });
}

@Component({
  imports: [PixelChartGaugeComponent],
  template: `
    <section data-theme="enterprise-light">
      <pixel-chart-gauge
        [value]="value()"
        [variant]="variant()"
        [showTicks]="showTicks()"
        label="Load"
        ariaLabel="Load gauge"
      />
    </section>
  `,
})
class HostComponent {
  readonly value = signal(72);
  readonly variant = signal<PixelChartGaugeVariant>('radial');
  readonly showTicks = signal(false);
}

describe('PixelChartGaugeComponent', () => {
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

  it('sets data-variant without rendering a separate details footer', () => {
    const el = fixture.nativeElement.querySelector('pixel-chart-gauge') as HTMLElement;
    expect(el.getAttribute('data-variant')).toBe('radial');
    expect(el.getAttribute('data-show-ticks')).toBe('false');
    expect(el.querySelector('.pixel-chart-gauge__footer')).toBeNull();
    fixture.componentInstance.variant.set('linear');
    fixture.detectChanges();
    expect(el.getAttribute('data-variant')).toBe('linear');
  });

  it('reflects showTicks on the host', () => {
    const el = fixture.nativeElement.querySelector('pixel-chart-gauge') as HTMLElement;
    fixture.componentInstance.showTicks.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('data-show-ticks')).toBe('true');

    fixture.componentInstance.showTicks.set(false);
    fixture.componentInstance.variant.set('tick');
    fixture.detectChanges();
    expect(el.getAttribute('data-show-ticks')).toBe('true');
  });

  it('supports Phase 2 variants on host data-variant', () => {
    const el = fixture.nativeElement.querySelector('pixel-chart-gauge') as HTMLElement;
    for (const v of ['solid', 'multi-range', 'dual', 'tick', 'vertical'] as const) {
      fixture.componentInstance.variant.set(v);
      fixture.detectChanges();
      expect(el.getAttribute('data-variant')).toBe(v);
    }
  });
});
