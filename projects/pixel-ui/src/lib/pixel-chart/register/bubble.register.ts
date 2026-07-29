import * as echarts from 'echarts/core';
import { CustomChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

/** Idempotent registration for cartesian + packed bubble charts. */
export function ensureBubbleChart(): void {
  if (registered) {
    return;
  }
  echarts.use([
    ScatterChart,
    CustomChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    CanvasRenderer,
  ]);
  registered = true;
}
