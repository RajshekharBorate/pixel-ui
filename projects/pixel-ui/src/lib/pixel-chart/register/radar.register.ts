import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import {
  RadarComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

/** Idempotent registration for radar charts. */
export function ensureRadarChart(): void {
  if (registered) {
    return;
  }
  echarts.use([RadarChart, RadarComponent, TooltipComponent, LegendComponent, CanvasRenderer]);
  registered = true;
}
