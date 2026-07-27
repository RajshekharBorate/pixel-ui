import * as echarts from 'echarts/core';
import { BarChart, GaugeChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

/**
 * Registers gauge + bar (linear / bullet) modules used by `pixel-chart-gauge`.
 */
export function ensureGaugeChart(): void {
  if (registered) {
    return;
  }
  echarts.use([
    GaugeChart,
    BarChart,
    GridComponent,
    TooltipComponent,
    MarkLineComponent,
    MarkPointComponent,
    TitleComponent,
    CanvasRenderer,
  ]);
  registered = true;
}
