import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { EChartsCoreOption } from 'echarts/core';
import PixelChartHostComponent, { mergeThemedOption } from './pixel-chart-host';
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
        [drillable]="drillable()"
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
  readonly drillable = signal(false);
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
      el.style.setProperty('--pixel-sys-font-family', 'Google Sans, sans-serif');
      document.body.appendChild(el);
      const theme = buildPixelChartEChartsTheme(el, 'brand');
      expect(theme.textStyle.color).toBe('#111');
      expect(theme.textStyle.fontFamily).toContain('Google Sans');
      expect(theme.categoryAxis.axisLabel.color).toBe('#111');
      expect(theme.categoryAxis.nameTextStyle.color).toBe('#111');
      expect(theme.valueAxis.nameTextStyle.color).toBe(
        theme.valueAxis.axisLabel.color,
      );
      expect(theme.valueAxis.splitLine.lineStyle.opacity).toBe(0.75);
      expect(theme.categoryAxis.splitLine.lineStyle.opacity).toBe(0.75);
      expect(theme.valueAxis.splitLine.lineStyle.width).toBe(0.5);
      expect(theme.categoryAxis.splitLine.lineStyle.width).toBe(0.5);
      expect(theme.tooltip.textStyle.fontFamily).toContain('Google Sans');
      expect(theme.tooltip.borderWidth).toBe(1);
      expect(theme.tooltip.extraCssText).toContain('border-radius');
      expect(theme.tooltip.extraCssText).toContain('box-shadow');
      expect(theme.tooltip.textStyle.fontSize).toBeGreaterThan(0);
      expect(theme.color[0]).toBe('#1565c0');
      el.remove();
    });

    it('merges theme visualMap ramp and softens heatmap lows to transparent', () => {
      const el = document.createElement('div');
      el.setAttribute('data-color-scheme', 'dark');
      el.style.setProperty('--pixel-sys-surface', '#12141a');
      el.style.setProperty('--pixel-sys-on-surface', '#e3e2e6');
      el.style.setProperty('--pixel-sys-primary', '#a8c7fa');
      el.style.setProperty('--pixel-chart-map-ramp-low', '#e3f2fd');
      el.style.setProperty('--pixel-chart-map-ramp-low-mid', '#90caf9');
      el.style.setProperty('--pixel-chart-map-ramp-mid', '#42a5f5');
      el.style.setProperty('--pixel-chart-map-ramp-high-mid', '#1e88e5');
      el.style.setProperty('--pixel-chart-map-ramp-high', '#a8c7fa');
      document.body.appendChild(el);
      const theme = buildPixelChartEChartsTheme(el, 'brand');
      const merged = mergeThemedOption(
        theme,
        {
          visualMap: { type: 'continuous', min: 0, max: 100 },
          series: [{ type: 'heatmap', data: [] }],
          geo: { map: 'world' },
        },
        false,
      ) as Record<string, unknown>;
      const vm = merged['visualMap'] as {
        inRange: { color: string[] };
        textStyle: { color: string };
      };
      expect(vm.inRange.color[0]).toBe('rgba(0, 0, 0, 0)');
      // Transparent + last three theme stops (vivid upper half), not the full muddy ramp.
      expect(vm.inRange.color).toHaveLength(4);
      expect(vm.textStyle.color).toBe('#e3e2e6');
      // Dark canvas + light CSS ramp → JS replaces pale lows before heatmap reshape.
      expect(theme.visualMap?.inRange?.color?.[0]).not.toMatch(/e3f2fd|#e3f2fd/i);
      el.remove();
    });

    it('applies the active primary color to dataZoom handles', () => {
      const el = document.createElement('div');
      el.style.setProperty('--pixel-sys-primary', '#6750a4');
      el.style.setProperty('--pixel-sys-on-surface', '#1d1b20');
      document.body.appendChild(el);
      const theme = buildPixelChartEChartsTheme(el, 'brand');
      const merged = mergeThemedOption(
        theme,
        { dataZoom: [{ type: 'slider' }], series: [] },
        false,
      ) as Record<string, unknown>;
      const zoom = (merged['dataZoom'] as Record<string, unknown>[])[0]!;
      expect((zoom['handleStyle'] as { color: string }).color).toBe('#6750a4');
      expect((zoom['moveHandleStyle'] as { color: string }).color).toBe('#6750a4');
      el.remove();
    });

    it('shows Cartesian axis baselines while preserving explicit overrides', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      const theme = buildPixelChartEChartsTheme(el, 'brand');
      const merged = mergeThemedOption(
        theme,
        {
          xAxis: { type: 'category' },
          yAxis: [{ type: 'value' }, { type: 'value', axisLine: { show: false } }],
          series: [],
        },
        false,
      ) as Record<string, unknown>;
      const xAxis = merged['xAxis'] as { axisLine: { show: boolean } };
      const yAxes = merged['yAxis'] as { axisLine: { show: boolean } }[];
      expect(xAxis.axisLine.show).toBe(true);
      expect(yAxes[0]?.axisLine.show).toBe(true);
      expect(yAxes[1]?.axisLine.show).toBe(false);
      el.remove();
    });

    it('applies theme foreground to radar and polar axis labels', () => {
      const el = document.createElement('div');
      el.style.setProperty('--pixel-sys-on-surface', '#f5efff');
      el.style.setProperty('--pixel-sys-outline', '#938f99');
      el.style.setProperty('--pixel-sys-font-family', 'Google Sans, sans-serif');
      document.body.appendChild(el);
      const theme = buildPixelChartEChartsTheme(el, 'brand');
      const merged = mergeThemedOption(
        theme,
        {
          radar: { axisName: { lineHeight: 16 }, indicator: [{ name: 'Speed', max: 100 }] },
          angleAxis: { type: 'category', data: ['Speed'] },
          radiusAxis: { type: 'value' },
          series: [],
        },
        false,
      ) as Record<string, unknown>;

      const radar = merged['radar'] as {
        axisName: { color: string; fontFamily: string; lineHeight: number };
        splitLine: { lineStyle: { opacity: number; width: number } };
      };
      const angleAxis = merged['angleAxis'] as { axisLabel: { color: string } };
      expect(radar.axisName.color).toBe('#f5efff');
      expect(radar.axisName.fontFamily).toContain('Google Sans');
      expect(radar.axisName.lineHeight).toBe(16);
      expect(radar.splitLine.lineStyle.opacity).toBe(0.75);
      expect(radar.splitLine.lineStyle.width).toBe(0.5);
      expect(angleAxis.axisLabel.color).toBe('#f5efff');
      el.remove();
    });

    it('applies theme text color and font to gauge scale labels', () => {
      const el = document.createElement('div');
      el.style.setProperty('--pixel-sys-on-surface', '#f5efff');
      el.style.setProperty('--pixel-sys-font-family', 'Google Sans, sans-serif');
      document.body.appendChild(el);
      const theme = buildPixelChartEChartsTheme(el, 'brand');
      const merged = mergeThemedOption(
        theme,
        {
          series: [
            {
              type: 'gauge',
              axisLabel: { show: true, distance: 10 },
              axisTick: { show: true, lineStyle: { width: 1 } },
              splitLine: { show: true, lineStyle: { width: 1.5 } },
              anchor: { show: true, itemStyle: { color: '#1565c0' } },
              detail: { show: true },
              title: { show: true },
            },
          ],
        },
        false,
      ) as Record<string, unknown>;
      const gauge = (merged['series'] as Record<string, unknown>[])[0]!;
      const axisLabel = gauge['axisLabel'] as {
        color: string;
        fontFamily: string;
        distance: number;
      };
      expect(axisLabel.color).toBe('#f5efff');
      expect(axisLabel.fontFamily).toContain('Google Sans');
      expect(axisLabel.distance).toBe(10);
      expect(
        ((gauge['axisTick'] as { lineStyle: { color: string } }).lineStyle).color,
      ).toBe(theme.valueAxis.axisTick.lineStyle.color);
      expect(
        ((gauge['splitLine'] as { lineStyle: { color: string } }).lineStyle).color,
      ).toBe(theme.valueAxis.splitLine.lineStyle.color);
      expect(
        (gauge['anchor'] as { itemStyle: { borderColor: string; borderWidth: number } })
          .itemStyle,
      ).toEqual(
        expect.objectContaining({
          borderColor: theme.tooltip.backgroundColor,
          borderWidth: 2,
        }),
      );
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

    it('exposes data-drillable when drillable is set', () => {
      host.drillable.set(true);
      fixture.detectChanges();
      expect(getHostEl().getAttribute('data-drillable')).toBe('');
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

    it('preserves the dataZoom window across a theme change', async () => {
      host.option.set({
        xAxis: { type: 'category', data: ['A', 'B', 'C', 'D'] },
        yAxis: { type: 'value' },
        dataZoom: [{ type: 'inside', start: 0, end: 100 }],
        series: [{ type: 'line', data: [1, 2, 3, 4] }],
      });
      fixture.detectChanges();
      await fixture.whenStable();
      const chart = getChartCmp().getChart()!;
      chart.dispatchAction({ type: 'dataZoom', start: 20, end: 60 });

      const themeShell = fixture.nativeElement.querySelector('.theme-shell') as HTMLElement;
      themeShell.setAttribute('data-theme', 'enterprise-dark');
      themeShell.setAttribute('data-color-scheme', 'dark');
      await new Promise((resolve) => setTimeout(resolve, 0));

      const zoom = (chart.getOption() as { dataZoom: { start: number; end: number }[] })
        .dataZoom[0]!;
      expect(zoom.start).toBeCloseTo(20);
      expect(zoom.end).toBeCloseTo(60);
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
