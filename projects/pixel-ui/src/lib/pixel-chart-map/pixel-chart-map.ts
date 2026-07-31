import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import type { EChartsType } from 'echarts/core';
import PixelChartHostComponent from '../pixel-chart/pixel-chart-host';
import {
  buildMapChartOption,
  buildMapLinksTable,
  buildMapPointsTable,
  buildMapSummary,
  buildMapTable,
  mapPointsToLegendSeries,
  mapRegionsToLegendSeries,
  resolveMapLinkCoords,
  type PixelChartGeoPoint,
  type PixelChartMapLink,
  type PixelChartMapLineWidthScale,
  type PixelChartMapRegionKey,
  type PixelChartMapSizeScale,
  type PixelChartMapValueScale,
  type PixelChartMapVariant,
  type PixelChartMapGeoView,
  type PixelChartRegionDatum,
} from '../pixel-chart/builders/map-option';
import {
  PIXEL_CHART_MAP_APPEARANCE_DEFAULT,
  type PixelChartMapAppearance,
} from '../pixel-chart/builders/map-appearance';
import { ensureMapChart } from '../pixel-chart/register/map.register';
import type {
  PixelChartNumberFormat,
  PixelChartPalette,
  PixelChartShowValues,
} from '../pixel-chart/pixel-chart.types';

export type {
  PixelChartMapVariant,
  PixelChartMapRegionKey,
  PixelChartMapValueScale,
  PixelChartMapSizeScale,
  PixelChartMapLineWidthScale,
  PixelChartMapGeoView,
  PixelChartRegionDatum,
  PixelChartGeoPoint,
  PixelChartMapLink,
  PixelChartMapAppearance,
};

export type PixelChartRegionClickEvent = {
  readonly regionId: string;
  readonly regionName: string;
  readonly value: number | null;
  readonly category?: string;
  readonly originalEvent: Event;
};

export type PixelChartMapPointClickEvent = {
  readonly pointId: string | null;
  readonly name: string;
  readonly lon: number;
  readonly lat: number;
  readonly value: number | null;
  readonly size: number | null;
  readonly category?: string;
  readonly originalEvent: Event;
};

export type PixelChartMapLinkClickEvent = {
  readonly linkId: string | null;
  readonly name: string;
  readonly fromLon: number;
  readonly fromLat: number;
  readonly toLon: number;
  readonly toLat: number;
  readonly value: number | null;
  readonly originalEvent: Event;
};

let nextId = 0;

ensureMapChart();

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

/**
 * Geographic map facade (choropleth, area, point, bubble, scatter, symbol,
 * heatmap, route, flow). Register GeoJSON with `registerPixelChartMap` or pass
 * `[geoJson]` + `mapName`.
 */
@Component({
  selector: 'pixel-chart-map',
  imports: [PixelChartHostComponent],
  templateUrl: './pixel-chart-map.html',
  styleUrl: './pixel-chart-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-map',
    '[id]': 'id() || fallbackId',
    '[attr.data-variant]': 'variant()',
    '[attr.data-appearance]': 'appearance()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export default class PixelChartMapComponent {
  protected readonly fallbackId = `pixel-chart-map-${++nextId}`;

  private readonly host = viewChild(PixelChartHostComponent);

  /**
   * Map visualization mode.
   *
   * @type {PixelChartMapVariant}
   * @default 'choropleth'
   * @description choropleth | area | point | bubble | scatter | symbol | heatmap | route | flow
   */
  readonly variant = input<PixelChartMapVariant>('choropleth');

  /**
   * Visual density / hover elevation preset.
   *
   * @type {PixelChartMapAppearance}
   * @default 'soft'
   * @description minimal | soft | emphasis
   */
  readonly appearance = input<PixelChartMapAppearance>(PIXEL_CHART_MAP_APPEARANCE_DEFAULT);

  /**
   * Registered map name (`registerPixelChartMap` / ECharts `registerMap`).
   *
   * @type {string}
   * @default ''
   */
  readonly mapName = input('');

  /**
   * Optional GeoJSON — when set, registers under `mapName` before build.
   *
   * @type {object | null}
   * @default null
   */
  readonly geoJson = input<object | null>(null);

  /**
   * Region rows joined to GeoJSON features (choropleth / area).
   *
   * @type {readonly PixelChartRegionDatum[]}
   * @default []
   */
  readonly data = input<readonly PixelChartRegionDatum[]>([]);

  /**
   * Lon/lat points (point layers, heatmap intensity, link id resolution).
   *
   * @type {readonly PixelChartGeoPoint[]}
   * @default []
   */
  readonly points = input<readonly PixelChartGeoPoint[]>([]);

  /**
   * Directed links for route / flow (`from` / `to` as coords or point ids).
   *
   * @type {readonly PixelChartMapLink[]}
   * @default []
   */
  readonly links = input<readonly PixelChartMapLink[]>([]);

  /**
   * Feature property used to join `data` names (`name` or `id`).
   *
   * @type {PixelChartMapRegionKey}
   * @default 'name'
   */
  readonly regionKey = input<PixelChartMapRegionKey>('name');

  /**
   * Value scale for choropleth / heatmap `visualMap` (continuous or piecewise).
   *
   * @type {PixelChartMapValueScale | null}
   * @default null
   */
  readonly valueScale = input<PixelChartMapValueScale | null>(null);

  /**
   * Size domain / pixel range for bubble and scatter markers.
   *
   * @type {PixelChartMapSizeScale | null}
   * @default null
   */
  readonly sizeScale = input<PixelChartMapSizeScale | null>(null);

  /**
   * Line width domain for flow (optional route).
   *
   * @type {PixelChartMapLineWidthScale | null}
   * @default null
   */
  readonly lineWidthScale = input<PixelChartMapLineWidthScale | null>(null);

  /**
   * Heatmap blur radius (ECharts `blurSize`).
   *
   * @type {number}
   * @default 20
   */
  readonly heatmapBlur = input(20, { transform: numberAttribute });

  /**
   * Heatmap point radius before blur (ECharts `pointSize`).
   *
   * @type {number}
   * @default 18
   */
  readonly heatmapPointSize = input(18, { transform: numberAttribute });

  /**
   * Region / point labels. `auto` soft-caps point labels by density.
   *
   * @type {PixelChartShowValues}
   * @default false
   */
  readonly showValues = input<PixelChartShowValues>(false);

  /**
   * Fixed marker diameter for `point` (px). Also the fallback size.
   *
   * @type {number}
   * @default 10
   */
  readonly markerSize = input(10, { transform: numberAttribute });

  /**
   * Category → ECharts symbol for `symbol` variant.
   *
   * @type {Readonly<Record<string, string>> | null}
   * @default null
   */
  readonly symbolMap = input<Readonly<Record<string, string>> | null>(null);

  /**
   * Allow pan / zoom (ECharts roam).
   *
   * @type {boolean}
   * @default true
   */
  readonly roam = input(true, { transform: booleanAttribute });

  /**
   * Series color palette (choropleth ramp / categories / points).
   *
   * @type {PixelChartPalette}
   * @default 'brand'
   */
  readonly palette = input<PixelChartPalette>('brand');

  /**
   * Region ids hidden via legend (area).
   *
   * @type {readonly string[]}
   * @default []
   */
  readonly hiddenRegionIds = input<readonly string[]>([]);

  /**
   * Category ids hidden via legend (area / scatter / symbol).
   *
   * @type {readonly string[]}
   * @default []
   */
  readonly hiddenCategoryIds = input<readonly string[]>([]);

  /**
   * Optional map camera (boundingCoords / center / zoom) for drill-in.
   *
   * @type {PixelChartMapGeoView | null}
   * @default null
   */
  readonly geoView = input<PixelChartMapGeoView | null>(null);

  /**
   * Advanced number format for tooltips / labels.
   *
   * @type {PixelChartNumberFormat | null}
   * @default null
   */
  readonly valueFormat = input<PixelChartNumberFormat | null>(null);

  /**
   * Label for null values.
   *
   * @type {string}
   * @default '—'
   */
  readonly nullLabel = input('—');

  /**
   * Accessible name.
   *
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * Optional id override.
   *
   * @type {string}
   * @default ''
   */
  readonly id = input('');

  /**
   * Plot height.
   *
   * @type {string | number}
   * @default '360px'
   */
  readonly height = input<string | number>('360px');

  /**
   * Loading / busy.
   *
   * @type {boolean}
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Disabled (non-interactive).
   *
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Theme rebuild counter (docs theme toggle).
   *
   * @type {number}
   * @default 0
   */
  readonly themeVersion = input(0, { transform: numberAttribute });

  /**
   * Cross-chart sync group (host).
   *
   * @type {string}
   * @default ''
   */
  readonly syncGroup = input('');

  /** Region activated (choropleth / area). */
  readonly regionClick = output<PixelChartRegionClickEvent>();

  /** Point activated (point layers / heatmap). */
  readonly pointClick = output<PixelChartMapPointClickEvent>();

  /** Link activated (route / flow). */
  readonly linkClick = output<PixelChartMapLinkClickEvent>();

  protected readonly option = computed(() =>
    buildMapChartOption({
      variant: this.variant(),
      mapName: this.mapName(),
      geoJson: this.geoJson(),
      data: this.data(),
      points: this.points(),
      links: this.links(),
      hiddenRegionIds: new Set(this.hiddenRegionIds()),
      hiddenCategoryIds: new Set(this.hiddenCategoryIds()),
      regionKey: this.regionKey(),
      valueScale: this.valueScale(),
      sizeScale: this.sizeScale(),
      lineWidthScale: this.lineWidthScale(),
      heatmapBlur: this.heatmapBlur(),
      heatmapPointSize: this.heatmapPointSize(),
      showValues: this.showValues(),
      markerSize: this.markerSize(),
      symbolMap: this.symbolMap(),
      palette: this.palette(),
      roam: this.roam(),
      nullLabel: this.nullLabel(),
      valueFormat: this.valueFormat(),
      geoView: this.geoView(),
      appearance: this.appearance(),
    }),
  );

  protected readonly summary = computed(() =>
    buildMapSummary({
      variant: this.variant(),
      data: this.data(),
      points: this.points(),
      links: this.links(),
      mapName: this.mapName(),
    }),
  );

  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel().trim() || this.summary(),
  );

  /** Live ECharts instance for export / shell. */
  getChart(): EChartsType | null {
    return this.host()?.getChart() ?? null;
  }

  /** Shell CSV helper. */
  buildTable() {
    const variant = this.variant();
    if (isLinkVariant(variant)) {
      return buildMapLinksTable(this.links(), this.points());
    }
    if (isPointVariant(variant) || variant === 'heatmap') {
      return buildMapPointsTable(this.points());
    }
    return buildMapTable(this.data());
  }

  /** Shell legend helper for categorical area / scatter / symbol. */
  legendSeries() {
    const variant = this.variant();
    if (variant === 'area') {
      return mapRegionsToLegendSeries(this.data(), this.palette());
    }
    if (variant === 'scatter' || variant === 'symbol') {
      return mapPointsToLegendSeries(this.points(), this.palette());
    }
    return [];
  }

  protected onChartClick(event: unknown): void {
    if (this.disabled()) {
      return;
    }
    const e = event as {
      seriesType?: string;
      name?: string;
      value?: number | number[] | null;
      data?: {
        category?: string;
        name?: string;
        value?: number | number[] | null;
        id?: string;
        linkId?: string;
        role?: string;
        coords?: number[][];
      };
      event?: Event;
    };

    if (
      isLinkVariant(this.variant()) &&
      (e.seriesType === 'lines' || e.data?.linkId != null)
    ) {
      const id = e.data?.id ?? e.data?.linkId ?? null;
      const match = this.links().find((l) => l.id === id || l.name === e.name);
      const coords =
        e.data?.coords ??
        (match ? resolveMapLinkCoords(match, this.points()) : null);
      const from = coords?.[0];
      const to = coords?.[coords.length - 1];
      this.linkClick.emit({
        linkId: match?.id ?? id,
        name: match?.name ?? e.name ?? e.data?.name ?? '',
        fromLon: from?.[0] ?? Number.NaN,
        fromLat: from?.[1] ?? Number.NaN,
        toLon: to?.[0] ?? Number.NaN,
        toLat: to?.[1] ?? Number.NaN,
        value: match?.value ?? (typeof e.data?.value === 'number' ? e.data.value : null),
        originalEvent: e.event ?? (event as Event),
      });
      return;
    }
    // Flow endpoint markers are visual orientation aids, not separate region actions.
    if (isLinkVariant(this.variant()) && e.seriesType === 'scatter') {
      return;
    }

    if (isPointVariant(this.variant()) || this.variant() === 'heatmap') {
      const raw = e.data?.value ?? e.value;
      const coords = Array.isArray(raw) ? raw : null;
      const lon = coords?.[0];
      const lat = coords?.[1];
      const measure = coords?.[2];
      const id = e.data?.id ?? null;
      const match = this.points().find(
        (p) =>
          (id != null && p.id === id) ||
          (lon != null &&
            lat != null &&
            p.lon === lon &&
            p.lat === lat),
      );
      this.pointClick.emit({
        pointId: match?.id ?? id,
        name: match?.name ?? e.name ?? e.data?.name ?? '',
        lon: match?.lon ?? (typeof lon === 'number' ? lon : Number.NaN),
        lat: match?.lat ?? (typeof lat === 'number' ? lat : Number.NaN),
        value: match?.value ?? (typeof measure === 'number' ? measure : null),
        size: match?.size ?? null,
        category: match?.category ?? e.data?.category,
        originalEvent: e.event ?? (event as Event),
      });
      return;
    }

    const name = e.name ?? e.data?.name ?? '';
    const match = this.data().find(
      (d) => d.id === name || d.name === name || regionLabelMatch(d, name),
    );
    const scalar =
      typeof e.value === 'number'
        ? e.value
        : typeof e.data?.value === 'number'
          ? e.data.value
          : null;
    this.regionClick.emit({
      regionId: match?.id ?? name,
      regionName: match?.name ?? name,
      value: match?.value ?? scalar,
      category: match?.category ?? e.data?.category,
      originalEvent: e.event ?? (event as Event),
    });
  }
}

function regionLabelMatch(d: PixelChartRegionDatum, name: string): boolean {
  return (d.name?.trim() || d.id) === name;
}
