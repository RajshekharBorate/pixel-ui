import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

/**
 * Idempotent registration for bar/column charts (Canvas).
 * Import from family facades — never pull the full `echarts` build.
 */
export function ensureBarChart(): void {
  if (registered) {
    return;
  }
  echarts.use([
    BarChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    DatasetComponent,
    CanvasRenderer,
  ]);
  registered = true;
}
