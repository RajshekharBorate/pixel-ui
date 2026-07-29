import * as echarts from 'echarts/core';
import { BarChart, RadarChart } from 'echarts/charts';
import {
  RadarComponent,
  PolarComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

/** Idempotent registration for radar + polar-area charts. */
export function ensureRadarChart(): void {
  if (registered) {
    return;
  }
  echarts.use([
    RadarChart,
    BarChart,
    RadarComponent,
    PolarComponent,
    TooltipComponent,
    LegendComponent,
    CanvasRenderer,
  ]);
  registered = true;
}
