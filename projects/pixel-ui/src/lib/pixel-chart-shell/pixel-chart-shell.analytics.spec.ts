import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PixelChartShellComponent from './pixel-chart-shell';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

@Component({
  imports: [PixelChartShellComponent],
  template: `
    <pixel-chart-shell
      id="revenue-chart"
      [series]="[
        { id: 'revenue', name: 'Confidential revenue', data: [10] },
        { id: 'cost', name: 'Confidential cost', data: [5] }
      ]"
    />
  `,
})
class ChartShellAnalyticsHost {}

describe('pixel-chart-shell analytics', () => {
  let port: PixelUiAnalyticsPort;

  beforeEach(() => {
    port = { track: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: PIXEL_UI_ANALYTICS, useValue: port }],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('emits a label-free legend toggle event', () => {
    const fixture = TestBed.createComponent(ChartShellAnalyticsHost);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.pixel-chart-shell__legend-item') as HTMLButtonElement).click();

    expect(port.track).toHaveBeenCalledWith({
      name: 'ui.chart.legend_toggle',
      component: { name: 'pixel-chart-shell' },
      properties: {
        chartId: 'revenue-chart',
        seriesId: 'revenue',
        visible: false,
      },
    });
    expect(JSON.stringify(vi.mocked(port.track).mock.calls)).not.toContain('Confidential');
  });
});
