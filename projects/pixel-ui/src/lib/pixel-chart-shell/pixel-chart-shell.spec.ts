import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelChartShellComponent from './pixel-chart-shell';
import type { PixelChartSeries } from '../pixel-chart/pixel-chart.types';

@Component({
  imports: [PixelChartShellComponent],
  template: `
    <section data-theme="enterprise-light">
      <pixel-chart-shell
        title="Sales"
        description="By quarter"
        [series]="series()"
        [categories]="categories()"
        [(hiddenSeriesIds)]="hidden"
        [showTable]="true"
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
  readonly hidden = signal<readonly string[]>([]);
  readonly empty = signal<boolean | null>(null);
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

  it('renders title, description, legend, and table', () => {
    const el = shell();
    expect(el.querySelector('.pixel-chart-shell__title')?.textContent?.trim()).toBe('Sales');
    expect(el.querySelector('.pixel-chart-shell__description')?.textContent?.trim()).toBe(
      'By quarter',
    );
    expect(el.querySelectorAll('.pixel-chart-shell__legend-item')).toHaveLength(2);
    expect(el.querySelectorAll('.pixel-chart-shell__table tbody tr')).toHaveLength(2);
    expect(el.querySelector('.plot-stub')?.textContent?.trim()).toBe('plot');
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
