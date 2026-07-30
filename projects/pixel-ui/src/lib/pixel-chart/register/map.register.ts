import * as echarts from 'echarts/core';
import { HeatmapChart, LinesChart, MapChart, ScatterChart } from 'echarts/charts';
import {
  GeoComponent,
  VisualMapComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

/**
 * Idempotent registration for map / geo charts.
 * Phase 1–3: MapChart, ScatterChart, HeatmapChart, LinesChart + VisualMap / Geo.
 */
export function ensureMapChart(): void {
  if (registered) {
    return;
  }
  echarts.use([
    MapChart,
    ScatterChart,
    HeatmapChart,
    LinesChart,
    GeoComponent,
    VisualMapComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    CanvasRenderer,
  ]);
  registered = true;
}
