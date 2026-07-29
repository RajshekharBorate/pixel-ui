import * as echarts from 'echarts/core';
import { ScatterChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

/** Idempotent registration for scatter (+ trendline as line). */
export function ensureScatterChart(): void {
  if (registered) {
    return;
  }
  echarts.use([
    ScatterChart,
    LineChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    MarkLineComponent,
    DataZoomComponent,
    CanvasRenderer,
  ]);
  registered = true;
}
