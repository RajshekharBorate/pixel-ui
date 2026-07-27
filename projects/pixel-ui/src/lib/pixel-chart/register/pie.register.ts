import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

/** Idempotent registration for pie / donut / semi-donut (Canvas). */
export function ensurePieChart(): void {
  if (registered) {
    return;
  }
  echarts.use([PieChart, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);
  registered = true;
}
