import { ensureLineChart } from './line.register';

/**
 * Area charts use the ECharts line series + `areaStyle`.
 * Same modular registration as line.
 */
export function ensureAreaChart(): void {
  ensureLineChart();
}
