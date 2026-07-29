import type { EChartsType } from 'echarts/core';
import * as echarts from 'echarts/core';

export type PixelChartSyncHandle = {
  /** Unique group id passed to `echarts.connect`. */
  readonly groupId: string;
  /** Disconnect charts in this group. */
  readonly disconnect: () => void;
};

let nextSyncGroup = 0;

/**
 * Cross-chart axis / dataZoom sync via ECharts `connect`.
 * Pass live chart instances from `getChart()` (nulls are ignored).
 *
 * @returns handle with `disconnect()` — call on destroy.
 */
export function connectPixelCharts(
  charts: readonly (EChartsType | null | undefined)[],
  groupId?: string,
): PixelChartSyncHandle {
  const id = groupId?.trim() || `pixel-chart-sync-${++nextSyncGroup}`;
  const live = charts.filter((c): c is EChartsType => !!c);
  for (const chart of live) {
    chart.group = id;
  }
  if (live.length > 0) {
    echarts.connect(id);
  }
  return {
    groupId: id,
    disconnect: () => {
      echarts.disconnect(id);
      for (const chart of live) {
        if (chart.group === id) {
          chart.group = undefined as unknown as string;
        }
      }
    },
  };
}
