import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import PixelChartShellComponent from './pixel-chart-shell';
import type { PixelChartSeries } from '../pixel-chart/pixel-chart.types';
import type { PixelChartShellAppearance } from './pixel-chart-shell';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';

@Component({
  imports: [PixelChartShellComponent],
  template: `
    <section data-theme="enterprise-light">
      <pixel-chart-shell
        title="Sales"
        description="By quarter"
        [series]="series()"
        [categories]="categories()"
        [appearance]="appearance()"
        [showLegend]="showLegend()"
        [(hiddenSeriesIds)]="hidden"
        [empty]="empty()"
      >
        <div class="plot-stub">plot</div>
      </pixel-chart-shell>
    </section>
  `,
})
class HostComponent {
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'Product A', data: [10, 20] },
    { id: 'b', name: 'Product B', data: [5, 15] },
  ]);
  readonly categories = signal(['Q1', 'Q2']);
  readonly appearance = signal<PixelChartShellAppearance>('outlined');
  readonly hidden = signal<readonly string[]>([]);
  readonly empty = signal<boolean | null>(null);
  readonly showLegend = signal(true);
}

describe('PixelChartShellComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  function shell(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-chart-shell') as HTMLElement;
  }

  it('renders title, description, legend, and circular action buttons without native title tooltip', () => {
    const el = shell();
    expect(el.querySelector('.pixel-chart-shell__title')?.textContent?.trim()).toBe('Sales');
    expect(el.querySelector('.pixel-chart-shell__description')?.textContent?.trim()).toBe(
      'By quarter',
    );
    expect(el.querySelectorAll('.pixel-chart-shell__legend-item')).toHaveLength(2);
    expect(el.querySelector('.plot-stub')?.textContent?.trim()).toBe('plot');
    expect(el.querySelector('.pixel-chart-shell__table')).toBeNull();
    expect(el.getAttribute('title')).toBeNull();
    const card = el.querySelector('pixel-card') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.getAttribute('data-appearance')).toBe('outlined');
    expect(card.getAttribute('data-padding')).toBe('none');
    expect(card.getAttribute('role')).toBeNull();
    expect(card.querySelector<HTMLElement>('.pixel-chart-shell__content')?.tabIndex).toBe(0);
    expect(el.querySelectorAll('.pixel-chart-shell__actions pixel-button')).toHaveLength(3);
    expect(fixture.debugElement.queryAll(By.directive(PixelTooltipDirective))).toHaveLength(3);
  });

  it('forwards appearance to the composed pixel-card', () => {
    host.appearance.set('elevated');
    fixture.detectChanges();
    expect(shell().querySelector('pixel-card')?.getAttribute('data-appearance')).toBe('elevated');
    host.appearance.set('filled');
    fixture.detectChanges();
    expect(shell().querySelector('pixel-card')?.getAttribute('data-appearance')).toBe('filled');
  });

  it('exposes showValues from the more menu', () => {
    const shellCmp = fixture.debugElement.query(By.directive(PixelChartShellComponent))
      .componentInstance as PixelChartShellComponent;
    expect(shellCmp.showValues()).toBe(false);
    shellCmp.showValues.set(true);
    fixture.detectChanges();
    expect(shellCmp.showValues()).toBe(true);
    expect(
      shell().querySelector(
        '.pixel-chart-shell__actions pixel-button button[aria-label="Chart display options"]',
      ),
    ).toBeTruthy();
  });

  it('adds tooltips to zoom and standard shell actions', () => {
    host.categories.set(Array.from({ length: 24 }, (_, index) => `M${index + 1}`));
    fixture.detectChanges();
    expect(shell().querySelectorAll('.pixel-chart-shell__actions pixel-button')).toHaveLength(5);
    expect(fixture.debugElement.queryAll(By.directive(PixelTooltipDirective))).toHaveLength(5);
  });

  it('toggles legend visibility via model', () => {
    const buttons = shell().querySelectorAll(
      '.pixel-chart-shell__legend-item',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0]!.click();
    fixture.detectChanges();
    expect(host.hidden()).toEqual(['a']);
    expect(buttons[0]!.classList.contains('pixel-chart-shell__legend-item--hidden')).toBe(true);
  });

  it('can hide the legend', () => {
    host.showLegend.set(false);
    fixture.detectChanges();
    expect(shell().querySelector('.pixel-chart-shell__legend')).toBeNull();
  });

  it('shows empty state when series is empty', () => {
    host.series.set([]);
    fixture.detectChanges();
    expect(shell().querySelector('pixel-empty-state')).toBeTruthy();
    expect(shell().querySelector('.plot-stub')).toBeNull();
  });

  it('keeps plot content when empty is forced false without series', () => {
    host.series.set([]);
    host.empty.set(false);
    fixture.detectChanges();
    expect(shell().querySelector('pixel-empty-state')).toBeNull();
    expect(shell().querySelector('.plot-stub')?.textContent?.trim()).toBe('plot');
  });
});
