import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelChartSparklineComponent, { buildSparklinePath } from './pixel-chart-sparkline';

describe('buildSparklinePath', () => {
  it('returns empty paths for empty input', () => {
    expect(buildSparklinePath([])).toEqual({ line: '', area: '' });
  });

  it('builds a line path for values', () => {
    const { line, area } = buildSparklinePath([1, 2, 3]);
    expect(line.startsWith('M')).toBe(true);
    expect(area).toBe('');
  });

  it('builds an area path when requested', () => {
    const { area } = buildSparklinePath([1, 3, 2], { area: true });
    expect(area).toContain('Z');
  });
});

@Component({
  imports: [PixelChartSparklineComponent],
  template: `
    <pixel-chart-sparkline [values]="values()" ariaLabel="Weekly trend" variant="area" tone="success" />
  `,
})
class HostComponent {
  readonly values = signal<readonly number[]>([2, 4, 3, 6, 5]);
}

describe('PixelChartSparklineComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders svg with aria-label', () => {
    const el = fixture.nativeElement.querySelector('pixel-chart-sparkline') as HTMLElement;
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Weekly trend');
    expect(el.getAttribute('data-variant')).toBe('area');
    expect(el.querySelector('.pixel-chart-sparkline__line')).toBeTruthy();
    expect(el.querySelector('.pixel-chart-sparkline__area')).toBeTruthy();
  });
});
