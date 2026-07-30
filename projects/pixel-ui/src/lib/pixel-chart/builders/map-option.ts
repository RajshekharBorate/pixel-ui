import type { EChartsCoreOption } from 'echarts/core';
import { resolvePixelChartPaletteColors } from '../pixel-chart-theme';
import type {
  PixelChartNumberFormat,
  PixelChartPalette,
  PixelChartSeries,
  PixelChartShowValues,
} from '../pixel-chart.types';
import { formatChartValue, resolveShowLabel } from './cartesian-utils';
import { isPixelChartMapRegistered, registerPixelChartMap } from './map-geo';
import type { PixelChartMapGeoView } from './map-drill';

export type { PixelChartMapGeoView } from './map-drill';

/** Map visualization modes (Phase 1–3). */
export type PixelChartMapVariant =
  | 'choropleth'
  | 'area'
  | 'point'
  | 'bubble'
  | 'scatter'
  | 'symbol'
  | 'heatmap'
  | 'route'
  | 'flow';

/** How region data joins to GeoJSON features. */
export type PixelChartMapRegionKey = 'name' | 'id';

/** Soft cap before `showValues: 'auto'` hides point labels. */
export const PIXEL_CHART_MAP_AUTO_LABEL_MAX_POINTS = 40;

/** Recommended max heatmap intensity points (canvas + labels off). */
export const PIXEL_CHART_MAP_MAX_HEATMAP_POINTS = 5_000;

/** Recommended max route / flow links. */
export const PIXEL_CHART_MAP_MAX_LINKS = 2_000;

/** Progressive drawing threshold for dense heatmap / lines. */
export const PIXEL_CHART_MAP_PROGRESSIVE_THRESHOLD = 1_000;

/** Default scatter / bubble marker diameter range (px). */
export const PIXEL_CHART_MAP_SIZE_RANGE: readonly [number, number] = [8, 48];

/** Default flow / route line width range (px). */
export const PIXEL_CHART_MAP_LINE_WIDTH_RANGE: readonly [number, number] = [1, 8];

/** Default ECharts heatmap blurSize. */
export const PIXEL_CHART_MAP_HEATMAP_BLUR = 20;

/** Default ECharts heatmap pointSize; large enough for sparse world datasets. */
export const PIXEL_CHART_MAP_HEATMAP_POINT_SIZE = 18;

/** Default ECharts symbols cycled for `symbol` / category markers. */
export const PIXEL_CHART_MAP_DEFAULT_SYMBOLS: readonly string[] = [
  'circle',
  'rect',
  'roundRect',
  'triangle',
  'diamond',
  'pin',
  'arrow',
];

/** One region row for choropleth / area fills. */
export type PixelChartRegionDatum = {
  readonly id: string;
  readonly name?: string;
  readonly value?: number | null;
  /** Categorical fill for `area` variant (and optional choropleth categories). */
  readonly category?: string;
};

/** Lon/lat point for point / bubble / scatter / symbol layers. */
export type PixelChartGeoPoint = {
  readonly id?: string;
  readonly name?: string;
  readonly lon: number;
  readonly lat: number;
  /** Intensity / measure (tooltips; bubble/scatter size fallback). */
  readonly value?: number | null;
  /** Explicit size measure for bubble / scatter. */
  readonly size?: number | null;
  /** Category for color (scatter) or symbol (symbol). */
  readonly category?: string;
  readonly label?: string;
};

/** Piecewise / continuous value scale (maps to ECharts visualMap). */
export type PixelChartMapValueScale = {
  readonly type?: 'continuous' | 'piecewise';
  readonly min?: number;
  readonly max?: number;
  readonly pieces?: readonly {
    readonly min?: number;
    readonly max?: number;
    readonly label?: string;
    readonly color?: string;
  }[];
  readonly unit?: string;
};

/** Size domain for bubble / scatter markers. */
export type PixelChartMapSizeScale = {
  readonly min?: number;
  readonly max?: number;
  /** Pixel diameter range `[minPx, maxPx]`. @default [8, 48] */
  readonly range?: readonly [number, number];
};

/** Lon/lat coordinate. */
export type PixelChartMapCoord = {
  readonly lon: number;
  readonly lat: number;
};

/**
 * Directed link for route / flow.
 * `from` / `to` may be coordinates or a point `id` resolved against `points`.
 */
export type PixelChartMapLink = {
  readonly id?: string;
  readonly name?: string;
  readonly from: PixelChartMapCoord | string;
  readonly to: PixelChartMapCoord | string;
  /** Flow volume / route weight. */
  readonly value?: number | null;
  /** Intermediate coords between from and to (great-circle segments). */
  readonly waypoints?: readonly PixelChartMapCoord[];
};

/** Line width domain for flow (and optional route emphasis). */
export type PixelChartMapLineWidthScale = {
  readonly min?: number;
  readonly max?: number;
  /** Pixel width range `[minPx, maxPx]`. @default [1, 8] */
  readonly range?: readonly [number, number];
};

export type PixelChartMapOptionArgs = {
  readonly variant: PixelChartMapVariant;
  /** Name passed to `echarts.registerMap` / series.map / geo.map. */
  readonly mapName: string;
  /** When set, registers (or re-registers) this GeoJSON under `mapName`. */
  readonly geoJson?: object | null;
  /** Region rows (choropleth / area). */
  readonly data?: readonly PixelChartRegionDatum[];
  /** Lon/lat points (point layers + heatmap intensity + link id resolution). */
  readonly points?: readonly PixelChartGeoPoint[];
  /** Directed links (route / flow). */
  readonly links?: readonly PixelChartMapLink[];
  readonly hiddenRegionIds?: ReadonlySet<string>;
  /** Hide points by category id (scatter / symbol / area legend). */
  readonly hiddenCategoryIds?: ReadonlySet<string>;
  readonly regionKey?: PixelChartMapRegionKey;
  readonly valueScale?: PixelChartMapValueScale | null;
  readonly sizeScale?: PixelChartMapSizeScale | null;
  readonly lineWidthScale?: PixelChartMapLineWidthScale | null;
  /** Heatmap blurSize (ECharts). @default 20 */
  readonly heatmapBlur?: number;
  /** Heatmap pointSize (ECharts). @default 18 */
  readonly heatmapPointSize?: number;
  readonly showValues?: PixelChartShowValues;
  readonly autoLabelMaxPoints?: number;
  /** Fixed marker diameter for `point` (and base for others). @default 10 */
  readonly markerSize?: number;
  /** Category → ECharts symbol name for `symbol` variant. */
  readonly symbolMap?: Readonly<Record<string, string>> | null;
  readonly palette?: PixelChartPalette;
  readonly roam?: boolean;
  readonly nullLabel?: string;
  readonly valueFormat?: PixelChartNumberFormat | null;
  readonly locale?: string;
  /** No-data / unmatched region fill. */
  readonly noDataColor?: string;
  /** Optional camera (center / zoom / boundingCoords) for drill-in. */
  readonly geoView?: PixelChartMapGeoView | null;
};

function isPointVariant(variant: PixelChartMapVariant): boolean {
  return (
    variant === 'point' ||
    variant === 'bubble' ||
    variant === 'scatter' ||
    variant === 'symbol'
  );
}

function isLinkVariant(variant: PixelChartMapVariant): boolean {
  return variant === 'route' || variant === 'flow';
}

function regionLabel(d: PixelChartRegionDatum, regionKey: PixelChartMapRegionKey): string {
  if (regionKey === 'id') {
    return d.id;
  }
  return (d.name?.trim() || d.id).trim();
}

function visibleRegions(
  data: readonly PixelChartRegionDatum[],
  hidden?: ReadonlySet<string>,
): PixelChartRegionDatum[] {
  if (!hidden?.size) {
    return [...data];
  }
  return data.filter((d) => !hidden.has(d.id));
}

function visiblePoints(
  points: readonly PixelChartGeoPoint[],
  hiddenCategories?: ReadonlySet<string>,
): PixelChartGeoPoint[] {
  const finite = points.filter(
    (p) => Number.isFinite(p.lon) && Number.isFinite(p.lat),
  );
  if (!hiddenCategories?.size) {
    return finite;
  }
  return finite.filter((p) => {
    const cat = p.category?.trim();
    return !cat || !hiddenCategories.has(cat);
  });
}

function resolveDomain(values: number[], scale: PixelChartMapValueScale | null | undefined): {
  min: number;
  max: number;
} {
  const finite = values.filter((v) => Number.isFinite(v));
  const dataMin = finite.length ? Math.min(...finite) : 0;
  const dataMax = finite.length ? Math.max(...finite) : 100;
  return {
    min: scale?.min ?? dataMin,
    max: scale?.max ?? (dataMax === dataMin ? dataMin + 1 : dataMax),
  };
}

function pointSizeMeasure(p: PixelChartGeoPoint): number | null {
  if (p.size != null && Number.isFinite(p.size)) {
    return p.size;
  }
  if (p.value != null && Number.isFinite(p.value)) {
    return p.value;
  }
  return null;
}

function mapPointSize(
  measure: number,
  domain: { min: number; max: number },
  range: readonly [number, number],
): number {
  const span = domain.max - domain.min || 1;
  const [symMin, symMax] = range;
  return symMin + ((measure - domain.min) / span) * (symMax - symMin);
}

function buildChoroplethVisualMap(args: {
  readonly scale: PixelChartMapValueScale | null | undefined;
  readonly domain: { min: number; max: number };
  readonly unit: string;
}): Record<string, unknown> {
  const { scale, domain, unit } = args;
  if (scale?.type === 'continuous' || (!scale?.pieces && scale?.type !== 'piecewise')) {
    return {
      type: 'continuous',
      min: domain.min,
      max: domain.max,
      left: 'left',
      bottom: 16,
      calculable: true,
      realtime: false,
      text: unit ? [`High (${unit})`, `Low`] : ['High', 'Low'],
    };
  }
  const pieces =
    scale?.pieces?.length ?
      scale.pieces.map((p) => ({
        min: p.min,
        max: p.max,
        label: p.label,
        color: p.color,
      }))
    : [
        { max: domain.min + (domain.max - domain.min) * 0.2, label: 'Low' },
        {
          min: domain.min + (domain.max - domain.min) * 0.2,
          max: domain.min + (domain.max - domain.min) * 0.4,
        },
        {
          min: domain.min + (domain.max - domain.min) * 0.4,
          max: domain.min + (domain.max - domain.min) * 0.6,
        },
        {
          min: domain.min + (domain.max - domain.min) * 0.6,
          max: domain.min + (domain.max - domain.min) * 0.8,
        },
        { min: domain.min + (domain.max - domain.min) * 0.8, label: 'High' },
      ];
  return {
    type: 'piecewise',
    left: 'left',
    bottom: 16,
    pieces,
    orient: 'vertical',
  };
}

function baseGeo(
  mapName: string,
  roam: boolean,
  noDataColor: string,
  geoView?: PixelChartMapGeoView | null,
): Record<string, unknown> {
  return {
    map: mapName,
    roam,
    itemStyle: {
      areaColor: noDataColor,
      borderColor: 'rgba(116, 119, 127, 0.55)',
      borderWidth: 0.75,
    },
    emphasis: {
      disabled: true,
    },
    silent: true,
    ...geoViewFields(geoView),
  };
}

function geoViewFields(geoView?: PixelChartMapGeoView | null): Record<string, unknown> {
  if (!geoView) {
    return {};
  }
  const out: Record<string, unknown> = {};
  if (geoView.boundingCoords) {
    out['boundingCoords'] = geoView.boundingCoords;
  }
  if (geoView.center) {
    out['center'] = geoView.center;
  }
  if (geoView.zoom != null && Number.isFinite(geoView.zoom)) {
    out['zoom'] = geoView.zoom;
  }
  return out;
}

function buildPointLayerOption(args: PixelChartMapOptionArgs & {
  readonly mapName: string;
}): EChartsCoreOption {
  const {
    variant,
    mapName,
    points = [],
    hiddenCategoryIds,
    sizeScale = null,
    showValues = 'auto',
    autoLabelMaxPoints = PIXEL_CHART_MAP_AUTO_LABEL_MAX_POINTS,
    markerSize = 10,
    symbolMap = null,
    palette = 'brand',
    roam = true,
    nullLabel = '—',
    valueFormat = null,
    locale,
    noDataColor = 'rgba(116, 119, 127, 0.22)',
  } = args;

  const visible = visiblePoints(points, hiddenCategoryIds);
  const colors = resolvePixelChartPaletteColors(palette);
  const categories = [
    ...new Set(
      visible.map((p) => p.category?.trim()).filter((c): c is string => !!c),
    ),
  ];
  const colorByCategory = new Map(
    categories.map((c, i) => [c, colors[i % colors.length]!] as const),
  );
  const defaultSymbolByCategory = new Map(
    categories.map((c, i) => [
      c,
      PIXEL_CHART_MAP_DEFAULT_SYMBOLS[i % PIXEL_CHART_MAP_DEFAULT_SYMBOLS.length]!,
    ] as const),
  );

  const sizeMeasures = visible
    .map(pointSizeMeasure)
    .filter((v): v is number => v != null);
  const sizeDomain = {
    min: sizeScale?.min ?? (sizeMeasures.length ? Math.min(...sizeMeasures) : 0),
    max:
      sizeScale?.max ??
      (sizeMeasures.length ? Math.max(...sizeMeasures) : 1),
  };
  if (sizeDomain.max === sizeDomain.min) {
    sizeDomain.max = sizeDomain.min + 1;
  }
  const sizeRange = sizeScale?.range ?? PIXEL_CHART_MAP_SIZE_RANGE;
  const showLabel = resolveShowLabel(
    showValues,
    1,
    visible.length,
    autoLabelMaxPoints,
  );
  const formatOpts = { format: valueFormat, locale, nullLabel };
  const primary = colors[0] ?? '#1565c0';

  const seriesData = visible.map((p) => {
    const measure = pointSizeMeasure(p);
    const cat = p.category?.trim();
    let symbolSize = markerSize;
    if (variant === 'bubble' || variant === 'scatter') {
      symbolSize =
        measure == null
          ? markerSize
          : mapPointSize(measure, sizeDomain, sizeRange);
    }
    const symbol =
      variant === 'symbol'
        ? (cat && symbolMap?.[cat]) ||
          (cat && defaultSymbolByCategory.get(cat)) ||
          'circle'
        : 'circle';
    const color =
      variant === 'scatter' || variant === 'symbol'
        ? (cat && colorByCategory.get(cat)) || primary
        : primary;

    return {
      name: p.name?.trim() || p.id || '',
      value: [p.lon, p.lat, measure ?? 0] as [number, number, number],
      id: p.id,
      category: cat,
      labelText: p.label?.trim() || undefined,
      symbol,
      symbolSize,
      itemStyle: { color },
    };
  });

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as {
          name?: string;
          value?: number[];
          data?: { category?: string; labelText?: string };
        };
        const parts = [p.name || p.data?.labelText || ''];
        if (p.data?.category) {
          parts.push(p.data.category);
        }
        const measure = p.value?.[2];
        if (measure != null && Number.isFinite(measure)) {
          parts.push(formatChartValue(measure, false, formatOpts));
        }
        return parts.filter(Boolean).join('<br/>');
      },
    },
    legend: { show: false },
    geo: baseGeo(mapName, roam, noDataColor, args.geoView),
    series: [
      {
        type: 'scatter',
        id: `pixel-map-${variant}`,
        name: variant,
        coordinateSystem: 'geo',
        data: seriesData,
        label: {
          show: showLabel,
          position: 'top',
          distance: 4,
          formatter: (params: {
            name?: string;
            data?: { labelText?: string; value?: number[] };
          }) => {
            if (params.data?.labelText) {
              return params.data.labelText;
            }
            if (params.name) {
              return params.name;
            }
            const measure = params.data?.value?.[2];
            if (measure == null || !Number.isFinite(measure)) {
              return '';
            }
            return formatChartValue(measure, false, formatOpts);
          },
        },
        emphasis: {
          focus: 'self',
          label: { show: true },
        },
      },
    ],
  };
}

function isCoord(v: unknown): v is PixelChartMapCoord {
  return (
    !!v &&
    typeof v === 'object' &&
    Number.isFinite((v as PixelChartMapCoord).lon) &&
    Number.isFinite((v as PixelChartMapCoord).lat)
  );
}

function resolveLinkEndpoint(
  ref: PixelChartMapCoord | string,
  byId: Map<string, PixelChartGeoPoint>,
): PixelChartMapCoord | null {
  if (isCoord(ref)) {
    return { lon: ref.lon, lat: ref.lat };
  }
  const hit = byId.get(String(ref).trim());
  if (!hit) {
    return null;
  }
  return { lon: hit.lon, lat: hit.lat };
}

/** Resolve link geometry to a polyline of [lon, lat] pairs. */
export function resolveMapLinkCoords(
  link: PixelChartMapLink,
  points: readonly PixelChartGeoPoint[] = [],
): [number, number][] | null {
  const byId = new Map(
    points
      .filter((p) => !!p.id?.trim())
      .map((p) => [p.id!.trim(), p] as const),
  );
  const from = resolveLinkEndpoint(link.from, byId);
  const to = resolveLinkEndpoint(link.to, byId);
  if (!from || !to) {
    return null;
  }
  const mids = (link.waypoints ?? []).filter(
    (w) => Number.isFinite(w.lon) && Number.isFinite(w.lat),
  );
  return [
    [from.lon, from.lat],
    ...mids.map((w) => [w.lon, w.lat] as [number, number]),
    [to.lon, to.lat],
  ];
}

/**
 * When `links` is empty, connect `points` in order as a single route polyline.
 */
function linksFromOrderedPoints(
  points: readonly PixelChartGeoPoint[],
): PixelChartMapLink[] {
  const finite = points.filter(
    (p) => Number.isFinite(p.lon) && Number.isFinite(p.lat),
  );
  if (finite.length < 2) {
    return [];
  }
  const first = finite[0]!;
  const last = finite[finite.length - 1]!;
  return [
    {
      id: 'route',
      name: 'Route',
      from: { lon: first.lon, lat: first.lat },
      to: { lon: last.lon, lat: last.lat },
      waypoints: finite.slice(1, -1).map((p) => ({ lon: p.lon, lat: p.lat })),
    },
  ];
}

function buildHeatmapOption(args: PixelChartMapOptionArgs & {
  readonly mapName: string;
}): EChartsCoreOption {
  const {
    mapName,
    points = [],
    valueScale = null,
    heatmapBlur = PIXEL_CHART_MAP_HEATMAP_BLUR,
    heatmapPointSize = PIXEL_CHART_MAP_HEATMAP_POINT_SIZE,
    roam = true,
    nullLabel = '—',
    valueFormat = null,
    locale,
    noDataColor = 'rgba(116, 119, 127, 0.22)',
  } = args;

  const visible = points.filter(
    (p) =>
      Number.isFinite(p.lon) &&
      Number.isFinite(p.lat) &&
      p.value != null &&
      Number.isFinite(p.value),
  );
  const values = visible.map((p) => p.value as number);
  const domain = resolveDomain(values, valueScale);
  const unit = valueScale?.unit?.trim() ?? '';
  const formatOpts = { format: valueFormat, locale, nullLabel };
  const progressive =
    visible.length >= PIXEL_CHART_MAP_PROGRESSIVE_THRESHOLD
      ? { progressive: 400, progressiveThreshold: 0 }
      : {};

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as {
          name?: string;
          value?: number[];
          data?: { name?: string };
        };
        const intensity = p.value?.[2];
        const label = p.name || p.data?.name || '';
        const formatted =
          intensity != null && Number.isFinite(intensity)
            ? formatChartValue(intensity, false, formatOpts)
            : nullLabel;
        const suffix = unit ? ` ${unit}` : '';
        return label
          ? `${label}<br/>${formatted}${suffix}`
          : `${formatted}${suffix}`;
      },
    },
    visualMap: buildChoroplethVisualMap({
      scale: valueScale,
      domain,
      unit,
    }),
    legend: { show: false },
    geo: baseGeo(mapName, roam, noDataColor, args.geoView),
    series: [
      {
        type: 'heatmap',
        id: 'pixel-map-heatmap',
        name: unit || 'Intensity',
        coordinateSystem: 'geo',
        blurSize: Math.max(0, heatmapBlur),
        pointSize: Math.max(1, heatmapPointSize),
        minOpacity: 0.3,
        maxOpacity: 0.95,
        z: 3,
        data: visible.map((p) => ({
          name: p.name?.trim() || p.id || '',
          value: [p.lon, p.lat, p.value as number] as [number, number, number],
          id: p.id,
        })),
        ...progressive,
      },
    ],
  };
}

function buildLinksOption(args: PixelChartMapOptionArgs & {
  readonly mapName: string;
}): EChartsCoreOption {
  const {
    variant,
    mapName,
    points = [],
    links: rawLinks = [],
    lineWidthScale = null,
    valueScale = null,
    showValues = false,
    markerSize = 10,
    palette = 'brand',
    roam = true,
    nullLabel = '—',
    valueFormat = null,
    locale,
    noDataColor = 'rgba(116, 119, 127, 0.22)',
  } = args;

  const links =
    rawLinks.length > 0 ? [...rawLinks] : linksFromOrderedPoints(points);
  const colors = resolvePixelChartPaletteColors(palette);
  const primary = colors[0] ?? '#1565c0';
  const formatOpts = { format: valueFormat, locale, nullLabel };

  const resolved = links
    .map((link) => {
      const coords = resolveMapLinkCoords(link, points);
      if (!coords || coords.length < 2) {
        return null;
      }
      return { link, coords };
    })
    .filter(
      (row): row is { link: PixelChartMapLink; coords: [number, number][] } =>
        !!row,
    );

  const volumes = resolved
    .map((r) => r.link.value)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const widthDomain = {
    min: lineWidthScale?.min ?? (volumes.length ? Math.min(...volumes) : 0),
    max:
      lineWidthScale?.max ??
      (volumes.length ? Math.max(...volumes) : 1),
  };
  if (widthDomain.max === widthDomain.min) {
    widthDomain.max = widthDomain.min + 1;
  }
  const widthRange = lineWidthScale?.range ?? PIXEL_CHART_MAP_LINE_WIDTH_RANGE;
  const valueDomain = resolveDomain(volumes, valueScale);

  const progressive =
    resolved.length >= PIXEL_CHART_MAP_PROGRESSIVE_THRESHOLD
      ? { progressive: 400, progressiveThreshold: 0 }
      : {};

  const lineData = resolved.map(({ link, coords }) => {
    const measure =
      link.value != null && Number.isFinite(link.value) ? link.value : null;
    const width =
      variant === 'flow' && measure != null
        ? mapPointSize(measure, widthDomain, widthRange)
        : variant === 'route'
          ? Math.max(widthRange[0], 2)
          : widthRange[0];
    const t =
      measure == null
        ? 0.5
        : (measure - valueDomain.min) / (valueDomain.max - valueDomain.min || 1);
    const color =
      variant === 'flow'
        ? colors[Math.min(colors.length - 1, Math.floor(t * colors.length))] ??
          primary
        : primary;

    return {
      name: link.name?.trim() || link.id || '',
      coords,
      value: measure ?? 0,
      id: link.id,
      lineStyle: {
        width,
        color,
        opacity: variant === 'flow' ? 0.7 : 0.95,
        curveness: variant === 'flow' ? 0.24 : 0,
        cap: 'round',
        join: 'round',
      },
    };
  });

  const haloData = lineData.map((line) => ({
    ...line,
    lineStyle: {
      ...line.lineStyle,
      width: Number(line.lineStyle.width) + (variant === 'flow' ? 3 : 4),
      color: primary,
      opacity: variant === 'flow' ? 0.1 : 0.14,
    },
  }));

  const series: Record<string, unknown>[] = [
    {
      type: 'lines',
      id: `pixel-map-${variant}-halo`,
      name: `${variant} halo`,
      coordinateSystem: 'geo',
      polyline: variant === 'route',
      silent: true,
      data: haloData,
      lineStyle: {
        color: primary,
        opacity: 0.12,
        cap: 'round',
        join: 'round',
      },
      z: 2,
      ...progressive,
    },
    {
      type: 'lines',
      id: `pixel-map-${variant}`,
      name: variant,
      coordinateSystem: 'geo',
      polyline: variant === 'route',
      symbol: variant === 'flow' ? ['none', 'arrow'] : ['none', 'none'],
      symbolSize: variant === 'flow' ? [0, 8] : [0, 0],
      data: lineData,
      lineStyle: {
        width: 2,
        color: primary,
        opacity: 0.85,
        cap: 'round',
        join: 'round',
      },
      emphasis: {
        lineStyle: { width: 4, opacity: 1 },
      },
      z: 3,
      ...progressive,
    },
  ];

  if (variant === 'route' && resolved.length) {
    const markers: {
      name: string;
      value: [number, number];
      linkId?: string;
      role: 'Origin' | 'Waypoint' | 'Destination';
      symbol: string;
      symbolSize: number;
      itemStyle: { color: string };
    }[] = [];
    for (const { link, coords } of resolved) {
      const origin = coords[0]!;
      const dest = coords[coords.length - 1]!;
      markers.push({
        name: 'Origin',
        value: origin,
        linkId: link.id,
        role: 'Origin',
        symbol: 'circle',
        symbolSize: markerSize + 4,
        itemStyle: { color: colors[1] ?? primary },
      });
      for (const mid of coords.slice(1, -1)) {
        markers.push({
          name: 'Waypoint',
          value: mid,
          linkId: link.id,
          role: 'Waypoint',
          symbol: 'circle',
          symbolSize: Math.max(6, markerSize - 2),
          itemStyle: { color: colors[2] ?? primary },
        });
      }
      markers.push({
        name: 'Destination',
        value: dest,
        linkId: link.id,
        role: 'Destination',
        symbol: 'pin',
        symbolSize: markerSize + 8,
        itemStyle: { color: colors[3] ?? primary },
      });
    }
    series.push({
      type: 'scatter',
      id: 'pixel-map-route-markers',
      name: 'Stops',
      coordinateSystem: 'geo',
      data: markers,
      label: {
        show: showValues === true,
        position: 'top',
        formatter: (params: { name?: string }) => params.name ?? '',
      },
      emphasis: {
        scale: 1.2,
        label: { show: true },
      },
      z: 5,
    });
  } else if (variant === 'flow' && resolved.length) {
    const markersByCoord = new Map<
      string,
      {
        name: string;
        value: [number, number];
        role: 'Hub' | 'Destination';
        symbolSize: number;
        itemStyle: { color: string };
      }
    >();
    for (const { coords } of resolved) {
      const origin = coords[0]!;
      const destination = coords[coords.length - 1]!;
      markersByCoord.set(`${origin[0]},${origin[1]}`, {
        name: 'Hub',
        value: origin,
        role: 'Hub',
        symbolSize: markerSize + 5,
        itemStyle: { color: colors[1] ?? primary },
      });
      markersByCoord.set(`${destination[0]},${destination[1]}`, {
        name: 'Destination',
        value: destination,
        role: 'Destination',
        symbolSize: Math.max(6, markerSize - 2),
        itemStyle: { color: colors[2] ?? primary },
      });
    }
    series.push({
      type: 'scatter',
      id: 'pixel-map-flow-markers',
      name: 'Flow endpoints',
      coordinateSystem: 'geo',
      data: [...markersByCoord.values()],
      emphasis: {
        scale: 1.25,
        label: {
          show: true,
          position: 'top',
          formatter: (params: { data?: { role?: string } }) =>
            params.data?.role ?? '',
        },
      },
      z: 5,
    });
  }

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as {
          seriesType?: string;
          name?: string;
          value?: number | number[];
          data?: { value?: number; name?: string };
        };
        if (p.seriesType === 'scatter') {
          return p.name ?? '';
        }
        const measure =
          typeof p.data?.value === 'number'
            ? p.data.value
            : typeof p.value === 'number'
              ? p.value
              : null;
        const parts = [p.name || p.data?.name || variant];
        if (measure != null && Number.isFinite(measure) && measure !== 0) {
          parts.push(formatChartValue(measure, false, formatOpts));
        }
        return parts.filter(Boolean).join('<br/>');
      },
    },
    legend: { show: false },
    geo: baseGeo(mapName, roam, noDataColor, args.geoView),
    series,
  };
}

/**
 * Pure ECharts option builder for map charts (Phase 1–3).
 * Call `ensureMapChart()` before rendering. Register GeoJSON via
 * `registerPixelChartMap` or pass `geoJson` here.
 */
export function buildMapChartOption(args: PixelChartMapOptionArgs): EChartsCoreOption {
  const {
    variant,
    mapName,
    geoJson = null,
    data = [],
    hiddenRegionIds,
    regionKey = 'name',
    valueScale = null,
    showValues = false,
    palette = 'brand',
    roam = true,
    nullLabel = '—',
    valueFormat = null,
    locale,
    noDataColor = 'rgba(116, 119, 127, 0.22)',
    geoView = null,
  } = args;

  const name = mapName.trim();
  if (!name) {
    return { series: [] };
  }
  if (geoJson) {
    registerPixelChartMap(name, geoJson);
  }
  if (!isPixelChartMapRegistered(name)) {
    // Async consumers may render before their GeoJSON request completes.
    // Never pass an unregistered map name to ECharts.
    return { series: [] };
  }

  if (variant === 'heatmap') {
    return buildHeatmapOption({ ...args, mapName: name });
  }
  if (isLinkVariant(variant)) {
    return buildLinksOption({ ...args, mapName: name });
  }
  if (isPointVariant(variant)) {
    return buildPointLayerOption({ ...args, mapName: name });
  }

  const visible = visibleRegions(data, hiddenRegionIds);
  const formatOpts = { format: valueFormat, locale, nullLabel };

  if (variant === 'area') {
    const categories = [...new Set(visible.map((d) => d.category?.trim() || d.id))];
    const colors = resolvePixelChartPaletteColors(palette);
    const colorByCategory = new Map(
      categories.map((c, i) => [c, colors[i % colors.length]!] as const),
    );
    const seriesData = visible.map((d) => {
      const cat = d.category?.trim() || d.id;
      return {
        name: regionLabel(d, regionKey),
        value: d.value ?? 0,
        itemStyle: { areaColor: colorByCategory.get(cat) },
        category: cat,
      };
    });
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { name?: string; data?: { category?: string } };
          const cat = p.data?.category ?? '';
          return cat ? `${p.name ?? ''}<br/>${cat}` : (p.name ?? '');
        },
      },
      legend: { show: false },
      series: [
        {
          type: 'map',
          id: 'pixel-map-area',
          name: 'Regions',
          map: name,
          roam,
          ...geoViewFields(geoView),
          emphasis: {
            label: { show: true },
            itemStyle: { areaColor: undefined },
          },
          select: { disabled: true },
          itemStyle: {
            areaColor: noDataColor,
            borderColor: 'rgba(116, 119, 127, 0.55)',
            borderWidth: 0.75,
          },
          label: {
            show: showValues === true,
            formatter: (params: { name?: string }) => params.name ?? '',
          },
          data: seriesData,
        },
      ],
    };
  }

  // choropleth
  const values = visible
    .map((d) => d.value)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const domain = resolveDomain(values, valueScale);
  const unit = valueScale?.unit?.trim() ?? '';
  const seriesData = visible.map((d) => ({
    name: regionLabel(d, regionKey),
    value: d.value == null || !Number.isFinite(d.value) ? undefined : d.value,
  }));

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as { name?: string; value?: number | null };
        const formatted = formatChartValue(p.value, false, formatOpts);
        const suffix = unit && p.value != null ? ` ${unit}` : '';
        return `${p.name ?? ''}<br/>${formatted}${suffix}`;
      },
    },
    visualMap: buildChoroplethVisualMap({
      scale: valueScale,
      domain,
      unit,
    }),
    legend: { show: false },
    series: [
      {
        type: 'map',
        id: 'pixel-map-choropleth',
        name: unit || 'Value',
        map: name,
        roam,
        nameProperty: regionKey === 'id' ? 'id' : 'name',
        ...geoViewFields(geoView),
        emphasis: {
          label: { show: true },
          itemStyle: { areaColor: undefined },
        },
        select: { disabled: true },
        itemStyle: {
          areaColor: noDataColor,
          borderColor: 'rgba(116, 119, 127, 0.55)',
          borderWidth: 0.75,
        },
        label: {
          show: showValues === true,
          formatter: (params: { name?: string; value?: number | null }) => {
            if (params.value == null || params.value === undefined) {
              return '';
            }
            return formatChartValue(params.value, false, formatOpts);
          },
        },
        data: seriesData,
      },
    ],
  };
}

/** Accessible / CSV table for region maps. */
export function buildMapTable(data: readonly PixelChartRegionDatum[]): {
  columns: { key: string; header: string }[];
  rows: Readonly<Record<string, string | number | null>>[];
} {
  const hasCategory = data.some((d) => !!d.category?.trim());
  return {
    columns: [
      { key: 'id', header: 'Id' },
      { key: 'name', header: 'Name' },
      ...(hasCategory ? [{ key: 'category', header: 'Category' }] : []),
      { key: 'value', header: 'Value' },
    ],
    rows: data.map((d) => ({
      id: d.id,
      name: d.name ?? d.id,
      ...(hasCategory ? { category: d.category ?? null } : {}),
      value: d.value ?? null,
    })),
  };
}

/** Accessible / CSV table for geo points. */
export function buildMapPointsTable(points: readonly PixelChartGeoPoint[]): {
  columns: { key: string; header: string }[];
  rows: Readonly<Record<string, string | number | null>>[];
} {
  const hasCategory = points.some((p) => !!p.category?.trim());
  const hasSize = points.some((p) => p.size != null);
  return {
    columns: [
      { key: 'id', header: 'Id' },
      { key: 'name', header: 'Name' },
      { key: 'lon', header: 'Lon' },
      { key: 'lat', header: 'Lat' },
      ...(hasCategory ? [{ key: 'category', header: 'Category' }] : []),
      { key: 'value', header: 'Value' },
      ...(hasSize ? [{ key: 'size', header: 'Size' }] : []),
    ],
    rows: points.map((p) => ({
      id: p.id ?? null,
      name: p.name ?? p.id ?? null,
      lon: p.lon,
      lat: p.lat,
      ...(hasCategory ? { category: p.category ?? null } : {}),
      value: p.value ?? null,
      ...(hasSize ? { size: p.size ?? null } : {}),
    })),
  };
}

/** Accessible / CSV table for route / flow links. */
export function buildMapLinksTable(
  links: readonly PixelChartMapLink[],
  points: readonly PixelChartGeoPoint[] = [],
): {
  columns: { key: string; header: string }[];
  rows: Readonly<Record<string, string | number | null>>[];
} {
  return {
    columns: [
      { key: 'id', header: 'Id' },
      { key: 'name', header: 'Name' },
      { key: 'fromLon', header: 'From lon' },
      { key: 'fromLat', header: 'From lat' },
      { key: 'toLon', header: 'To lon' },
      { key: 'toLat', header: 'To lat' },
      { key: 'waypoints', header: 'Waypoints' },
      { key: 'value', header: 'Value' },
    ],
    rows: links.map((link) => {
      const coords = resolveMapLinkCoords(link, points);
      const from = coords?.[0];
      const to = coords?.[coords.length - 1];
      return {
        id: link.id ?? null,
        name: link.name ?? link.id ?? null,
        fromLon: from?.[0] ?? null,
        fromLat: from?.[1] ?? null,
        toLon: to?.[0] ?? null,
        toLat: to?.[1] ?? null,
        waypoints: Math.max(0, (coords?.length ?? 2) - 2),
        value: link.value ?? null,
      };
    }),
  };
}

function summarizeValueRange(values: readonly number[]): string | null {
  if (!values.length) {
    return null;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `value ${min}` : `values ${min} to ${max}`;
}

/** Screen-reader summary for map charts. */
export function buildMapSummary(args: {
  readonly variant: PixelChartMapVariant;
  readonly data?: readonly PixelChartRegionDatum[];
  readonly points?: readonly PixelChartGeoPoint[];
  readonly links?: readonly PixelChartMapLink[];
  readonly mapName?: string;
}): string {
  const parts = [
    `Map chart (${args.variant})`,
    args.mapName?.trim() ? `map ${args.mapName.trim()}` : null,
  ];
  if (args.variant === 'heatmap') {
    const pts = args.points ?? [];
    parts.push(`${pts.length} intensity points`);
    parts.push(
      summarizeValueRange(
        pts
          .map((p) => p.value)
          .filter((v): v is number => v != null && Number.isFinite(v)),
      ),
    );
  } else if (isLinkVariant(args.variant)) {
    const links = args.links?.length
      ? args.links
      : linksFromOrderedPoints(args.points ?? []);
    parts.push(`${links.length} links`);
    parts.push(
      summarizeValueRange(
        links
          .map((l) => l.value)
          .filter((v): v is number => v != null && Number.isFinite(v)),
      ),
    );
  } else if (isPointVariant(args.variant)) {
    const pts = args.points ?? [];
    parts.push(`${pts.length} points`);
    parts.push(
      summarizeValueRange(
        pts
          .map((p) => (p.size != null && Number.isFinite(p.size) ? p.size : p.value))
          .filter((v): v is number => v != null && Number.isFinite(v)),
      ),
    );
  } else {
    const data = args.data ?? [];
    const values = data
      .map((d) => d.value)
      .filter((v): v is number => v != null && Number.isFinite(v));
    parts.push(`${data.length} regions`, `${values.length} with values`);
    parts.push(summarizeValueRange(values));
  }
  return parts.filter(Boolean).join('. ') + '.';
}

/** Categorical area regions → shell legend series shape. */
export function mapRegionsToLegendSeries(
  data: readonly PixelChartRegionDatum[],
  palette: PixelChartPalette = 'brand',
): PixelChartSeries[] {
  const colors = resolvePixelChartPaletteColors(palette);
  const seen = new Map<string, string>();
  for (const d of data) {
    const cat = d.category?.trim() || d.id;
    if (!seen.has(cat)) {
      seen.set(cat, cat);
    }
  }
  return [...seen.keys()].map((cat, i) => ({
    id: cat,
    name: cat,
    color: colors[i % colors.length],
    data: [],
  }));
}

/** Point categories → shell legend series shape (scatter / symbol). */
export function mapPointsToLegendSeries(
  points: readonly PixelChartGeoPoint[],
  palette: PixelChartPalette = 'brand',
): PixelChartSeries[] {
  const colors = resolvePixelChartPaletteColors(palette);
  const seen = new Map<string, string>();
  for (const p of points) {
    const cat = p.category?.trim();
    if (cat && !seen.has(cat)) {
      seen.set(cat, cat);
    }
  }
  return [...seen.keys()].map((cat, i) => ({
    id: cat,
    name: cat,
    color: colors[i % colors.length],
    data: [],
  }));
}
