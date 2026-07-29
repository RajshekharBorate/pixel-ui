import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

/**
 * Idempotent registration for line charts (Canvas).
 * Import from family facades — never pull the full `echarts` build.
 */
export function ensureLineChart(): void {
  if (registered) {
    return;
  }
  echarts.use([
    LineChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    DatasetComponent,
    DataZoomComponent,
    CanvasRenderer,
  ]);
  registered = true;
}
