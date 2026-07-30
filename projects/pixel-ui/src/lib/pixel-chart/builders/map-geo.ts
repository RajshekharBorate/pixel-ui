import * as echarts from 'echarts/core';
import { ensureMapChart } from '../register/map.register';

const registeredNames = new Set<string>();

/**
 * Register a GeoJSON (or TopoJSON object ECharts accepts) under `name`.
 * Idempotent for the same name + reference; call before rendering `pixel-chart-map`.
 *
 * GeoJSON is an **app / docs** concern — the library does not ship an atlas.
 */
export function registerPixelChartMap(
  name: string,
  geoJson: object,
  specialAreas?: Record<string, unknown>,
): void {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('registerPixelChartMap: map name is required');
  }
  ensureMapChart();
  if (specialAreas) {
    echarts.registerMap(trimmed, geoJson as never, specialAreas as never);
  } else {
    echarts.registerMap(trimmed, geoJson as never);
  }
  registeredNames.add(trimmed);
}

/** Whether `registerPixelChartMap` (or an equivalent) has registered this name in-process. */
export function isPixelChartMapRegistered(name: string): boolean {
  const trimmed = name.trim();
  return registeredNames.has(trimmed) || echarts.getMap(trimmed) != null;
}

/** Test helper — clears the in-process registration bookkeeping (not ECharts’ registry). */
export function resetPixelChartMapRegistryForTests(): void {
  registeredNames.clear();
}
