import { ensureLineChart } from './line.register';

/**
 * Area charts use the ECharts line series + `areaStyle` (including streamgraph).
 * Same modular registration as line — no ThemeRiver dependency.
 */
export function ensureAreaChart(): void {
  ensureLineChart();
}
