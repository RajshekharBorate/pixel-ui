import type { PixelChartRegionDatum } from './map-option';

/**
 * One level in a consumer-owned geographic drill stack.
 * Charts do not own navigation — apps push/pop levels and rebind the map.
 */
export type PixelChartMapDrillLevel = {
  readonly id: string;
  readonly label: string;
  readonly mapName: string;
  readonly geoJson: object;
  readonly data: readonly PixelChartRegionDatum[];
  /** Region that opened this level (omitted for root). */
  readonly parentRegionId?: string;
  /** Optional ECharts view hint for this level. */
  readonly geoView?: PixelChartMapGeoView | null;
};

/** Optional camera for a map / geo series (zoom-to-bounds on drill). */
export type PixelChartMapGeoView = {
  readonly center?: readonly [number, number];
  readonly zoom?: number;
  /** `[[minLon, minLat], [maxLon, maxLat]]` — preferred for drill-in. */
  readonly boundingCoords?: readonly [
    readonly [number, number],
    readonly [number, number],
  ];
};

/** Payload stored on breadcrumb `data` for drill-up. */
export type PixelChartMapDrillBreadcrumbData = {
  readonly levelId: string;
  readonly mapName: string;
  readonly parentRegionId?: string;
};

/**
 * Breadcrumb-compatible item (assignable to `PixelBreadcrumbItem`).
 * Omit `link` / `href` so in-page drill-up stays on `(itemClick)`.
 */
export type PixelChartMapDrillBreadcrumbItem = {
  readonly id: string;
  readonly label: string;
  readonly active?: boolean;
  readonly data?: PixelChartMapDrillBreadcrumbData;
};

/** Map drill levels → breadcrumb trail (last item marked active). */
export function mapDrillLevelsToBreadcrumbItems(
  levels: readonly PixelChartMapDrillLevel[],
): PixelChartMapDrillBreadcrumbItem[] {
  if (!levels.length) {
    return [];
  }
  return levels.map((level, index) => ({
    id: level.id,
    label: level.label,
    active: index === levels.length - 1,
    data: {
      levelId: level.id,
      mapName: level.mapName,
      parentRegionId: level.parentRegionId,
    },
  }));
}

/** Truncate the stack through `index` (inclusive) for breadcrumb drill-up. */
export function truncateMapDrillLevels(
  levels: readonly PixelChartMapDrillLevel[],
  index: number,
): PixelChartMapDrillLevel[] {
  if (!levels.length) {
    return [];
  }
  const end = Math.max(0, Math.min(index, levels.length - 1));
  return levels.slice(0, end + 1);
}

/** Append a child level (no-op when id already equals current). */
export function pushMapDrillLevel(
  levels: readonly PixelChartMapDrillLevel[],
  next: PixelChartMapDrillLevel,
): PixelChartMapDrillLevel[] {
  const current = levels[levels.length - 1];
  if (current?.id === next.id && current.mapName === next.mapName) {
    return [...levels];
  }
  return [...levels, next];
}

/**
 * Compute `boundingCoords` for an ECharts map/geo view from GeoJSON features.
 * Returns null when no finite coordinates are found.
 */
export function computeGeoJsonBoundingCoords(
  geoJson: object,
  padding = 0.08,
): PixelChartMapGeoView['boundingCoords'] | null {
  const ring: number[][] = [];
  walkCoords(geoJson, (lon, lat) => {
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      ring.push([lon, lat]);
    }
  });
  if (!ring.length) {
    return null;
  }
  let minLon = ring[0]![0];
  let maxLon = ring[0]![0];
  let minLat = ring[0]![1];
  let maxLat = ring[0]![1];
  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  const lonPad = Math.max((maxLon - minLon) * padding, 0.5);
  const latPad = Math.max((maxLat - minLat) * padding, 0.5);
  return [
    [minLon - lonPad, minLat - latPad],
    [maxLon + lonPad, maxLat + latPad],
  ];
}

function walkCoords(node: unknown, visit: (lon: number, lat: number) => void): void {
  if (!node || typeof node !== 'object') {
    return;
  }
  const obj = node as Record<string, unknown>;
  if (Array.isArray(obj['coordinates'])) {
    walkCoordTree(obj['coordinates'], visit);
  }
  if (Array.isArray(obj['features'])) {
    for (const f of obj['features']) {
      walkCoords(f, visit);
    }
  }
  if (obj['geometry']) {
    walkCoords(obj['geometry'], visit);
  }
  if (Array.isArray(obj['geometries'])) {
    for (const g of obj['geometries']) {
      walkCoords(g, visit);
    }
  }
}

function walkCoordTree(node: unknown, visit: (lon: number, lat: number) => void): void {
  if (!Array.isArray(node) || node.length === 0) {
    return;
  }
  if (typeof node[0] === 'number' && typeof node[1] === 'number') {
    visit(node[0], node[1]);
    return;
  }
  for (const child of node) {
    walkCoordTree(child, visit);
  }
}
