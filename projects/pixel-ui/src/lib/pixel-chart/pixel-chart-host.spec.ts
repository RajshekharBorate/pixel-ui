import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { EChartsCoreOption } from 'echarts/core';
import PixelChartHostComponent from './pixel-chart-host';
import { ensureBarChart } from './register/bar.register';
import { ensureLineChart } from './register/line.register';
import {
  buildPixelChartEChartsTheme,
  resolvePixelChartPaletteColors,
  PIXEL_CHART_PALETTE_BRAND,
} from './pixel-chart-theme';

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** Minimal 2d context so zrender/ECharts can init under jsdom. */
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
  imports: [PixelChartHostComponent],
  template: `
    <section
      class="theme-shell"
      data-theme="enterprise-light"
      data-color-scheme="light"
      style="--pixel-sys-primary: #1565c0; --pixel-sys-on-surface: #1a1b1f; --pixel-sys-surface: #fff; inline-size: 400px;"
    >
      <pixel-chart-host
        [option]="option()"
        [ariaLabel]="ariaLabel()"
        [loading]="loading()"
        [height]="280"
        (chartReady)="onReady()"
      />
    </section>
  `,
})
class HostComponent {
  readonly option = signal<EChartsCoreOption | null>(null);
  readonly ariaLabel = signal('Sales chart');
  readonly loading = signal(false);
  readyCount = 0;

  onReady(): void {
    this.readyCount += 1;
  }
}

describe('pixel-chart core (Phase 0)', () => {
  beforeAll(() => {
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
    installCanvasStub();
    ensureBarChart();
    ensureLineChart();
  });

  describe('theme + palette', () => {
    it('resolves named and custom palettes', () => {
      expect(resolvePixelChartPaletteColors('brand')).toEqual(PIXEL_CHART_PALETTE_BRAND);
      expect(resolvePixelChartPaletteColors(['#000', '#fff'])).toEqual(['#000', '#fff']);
    });

    it('builds an ECharts theme from CSS variables', () => {
      const el = document.createElement('div');
      el.style.setProperty('--pixel-sys-on-surface', '#111');
      el.style.setProperty('--pixel-sys-primary', '#1565c0');
      document.body.appendChild(el);
      const theme = buildPixelChartEChartsTheme(el, 'brand');
      expect(theme.textStyle.color).toBe('#111');
      expect(theme.color[0]).toBe('#1565c0');
      el.remove();
    });
  });

  describe('PixelChartHostComponent', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((r) => setTimeout(r, 0));
      fixture.detectChanges();
    });

    afterEach(() => {
      fixture.destroy();
      TestBed.resetTestingModule();
    });

    function getHostEl(): HTMLElement {
      return fixture.nativeElement.querySelector('pixel-chart-host') as HTMLElement;
    }

    function getChartCmp(): PixelChartHostComponent {
      return fixture.debugElement.query(By.directive(PixelChartHostComponent))
        .componentInstance as PixelChartHostComponent;
    }

    it('exposes img role and aria-label', () => {
      const el = getHostEl();
      expect(el.getAttribute('role')).toBe('img');
      expect(el.getAttribute('aria-label')).toBe('Sales chart');
    });

    it('sets aria-busy when loading', () => {
      host.loading.set(true);
      fixture.detectChanges();
      expect(getHostEl().getAttribute('aria-busy')).toBe('true');
    });

    it('inits a chart and applies a bar option without throwing', async () => {
      host.option.set({
        xAxis: { type: 'category', data: ['A', 'B'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [1, 2] }],
      });
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((r) => setTimeout(r, 0));

      expect(host.readyCount).toBeGreaterThanOrEqual(1);
      expect(getChartCmp().getChart()).not.toBeNull();
    });

    it('disposes the chart on destroy', async () => {
      host.option.set({
        xAxis: { type: 'category', data: ['A'] },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: [3] }],
      });
      fixture.detectChanges();
      await new Promise((r) => setTimeout(r, 0));

      const hostCmp = getChartCmp();
      expect(hostCmp.getChart()).not.toBeNull();
      fixture.destroy();
      expect(hostCmp.getChart()).toBeNull();
    });
  });

  describe('register modules', () => {
    it('ensureBarChart / ensureLineChart are idempotent', () => {
      expect(() => {
        ensureBarChart();
        ensureBarChart();
        ensureLineChart();
        ensureLineChart();
      }).not.toThrow();
    });
  });
});
