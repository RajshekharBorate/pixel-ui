import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
  DataZoomComponent,
  ToolboxComponent,
  BrushComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

/**
 * Idempotent registration for bar/column charts (Canvas).
 * DataZoom + Toolbox (+ Brush as select-zoom engine) when zoom is enabled.
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
    DataZoomComponent,
    ToolboxComponent,
    BrushComponent,
    CanvasRenderer,
  ]);
  registered = true;
}
