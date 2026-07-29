import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
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
 * Idempotent registration for line charts (Canvas).
 * DataZoom + Toolbox (+ Brush as select-zoom engine) — no visible brush UI.
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
    ToolboxComponent,
    BrushComponent,
    CanvasRenderer,
  ]);
  registered = true;
}
