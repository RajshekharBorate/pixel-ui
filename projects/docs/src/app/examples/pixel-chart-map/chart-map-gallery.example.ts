import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { PixelButtonComponent, PixelSelectComponent, type PixelSelectOption  } from 'pixel-ui';
import {
  PixelChartMapComponent,
  PixelChartShellComponent,
  PIXEL_CHART_MAP_WORLD_GEO_VIEW,
  mapPointsToLegendSeries,
  mapRegionsToLegendSeries,
  type PixelChartGeoPoint,
  type PixelChartMapAppearance,
  type PixelChartMapLink,
  type PixelChartMapVariant,
  type PixelChartRegionDatum,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-map-gallery-example',
  imports: [PixelButtonComponent, PixelChartShellComponent, PixelChartMapComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      <pixel-select
        label="Variant"
        size="sm"
        [options]="variantOptions"
        [value]="variant()"
        (valueChange)="onVariant($event)"
      />
      <pixel-select
        label="Appearance"
        size="sm"
        [options]="appearanceOptions"
        [value]="appearance()"
        (valueChange)="onAppearance($event)"
      />
    
      <pixel-button
        class="docs-chart-skeleton-toggle"
        size="sm"
        appearance="outline"
        (click)="showSkeleton.update((v) => !v)"
      >
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>
    </div>

    <pixel-chart-shell
      title="Map gallery"
      description="All nine geographic variants with shell export (PNG / SVG / PDF / CSV), loading, empty, and categorical legend where applicable. Keyboard users should use CSV export — canvas roam is pointer-oriented."
      [series]="legendSeries()"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [empty]="!!loadError() || (geoJson() != null && isEmpty())"
      [emptyHeading]="loadError() ? 'Map data unavailable' : 'No map data'"
      [emptyDescription]="
        loadError() || 'Provide GeoJSON and region, point, or link rows for this variant.'
      "
      [loading]="!showSkeleton() && !geoJson() && !loadError()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [getChart]="chartGetter"
      exportFileName="geo-map-gallery"
     [showSkeleton]="showSkeleton()">
      @if (geoJson() || showSkeleton()) {
        <pixel-chart-map
          #map
          [variant]="variant()"
          [appearance]="appearance()"
          mapName="world"
          [geoJson]="geoJson() ?? emptyGeoJson"
          [data]="regionData()"
          [points]="pointData()"
          [links]="linkData()"
          [hiddenRegionIds]="hiddenRegionIds()"
          [hiddenCategoryIds]="hidden()"
          [valueScale]="activeValueScale()"
          [sizeScale]="sizeScale"
          [lineWidthScale]="lineWidthScale"
          [symbolMap]="symbolMap"
          [valueFormat]="activeValueFormat()"
          [geoView]="worldView"
          [heatmapBlur]="22"
          [heatmapPointSize]="22"
          markerSize="10"
          [showValues]="showValues()"
          roam
          syncGroup="docs-map-gallery"
          height="400px"
          ariaLabel="Geographic map gallery"
          [showSkeleton]="showSkeleton()"
        />
      }
    </pixel-chart-shell>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: var(--pixel-sys-space-md, 1rem);
      margin-block-end: var(--pixel-sys-space-md, 1rem);
    }

    .toolbar > pixel-button {
      flex: 0 0 auto;
    }

    .toolbar > pixel-select {
      flex: 1 1 10rem;
      max-inline-size: 14rem;
      min-inline-size: 9rem;
    }

  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartMapGalleryExample {
  readonly showSkeleton = signal(false);

  private readonly map = viewChild(PixelChartMapComponent);

  readonly emptyGeoJson: object = { type: 'FeatureCollection', features: [] };
  readonly geoJson = signal<object | null>(null);
  readonly loadError = signal('');
  readonly variant = signal<PixelChartMapVariant>('choropleth');
  readonly appearance = signal<PixelChartMapAppearance>('soft');
  readonly hidden = signal<string[]>([]);
  readonly showValues = signal(false);
  readonly worldView = PIXEL_CHART_MAP_WORLD_GEO_VIEW;

  readonly variantOptions: readonly PixelSelectOption[] = [
    { value: 'choropleth', label: 'choropleth' },
    { value: 'area', label: 'area' },
    { value: 'point', label: 'point' },
    { value: 'bubble', label: 'bubble' },
    { value: 'scatter', label: 'scatter' },
    { value: 'symbol', label: 'symbol' },
    { value: 'heatmap', label: 'heatmap' },
    { value: 'route', label: 'route' },
    { value: 'flow', label: 'flow' },
  ];

  readonly appearanceOptions: readonly PixelSelectOption[] = [
    { value: 'minimal', label: 'minimal' },
    { value: 'soft', label: 'soft' },
    { value: 'emphasis', label: 'emphasis' },
  ];

  readonly currencyFormat = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  } as const;

  readonly choroplethScale = {
    type: 'piecewise' as const,
    unit: 'USD',
    pieces: [
      { max: 1_000_000, label: '< 1M' },
      { min: 1_000_000, max: 10_000_000, label: '1–10M' },
      { min: 10_000_000, max: 50_000_000, label: '10–50M' },
      { min: 50_000_000, max: 100_000_000, label: '50–100M' },
      { min: 100_000_000, label: '> 100M' },
    ],
  };

  readonly heatScale = { type: 'continuous' as const, unit: 'idx' };

  readonly sizeScale = { range: [10, 42] as const };
  readonly lineWidthScale = { range: [1.5, 6] as const };

  readonly symbolMap: Readonly<Record<string, string>> = {
    Warehouse: 'rect',
    Factory: 'triangle',
    Retail: 'diamond',
    Office: 'pin',
  };

  readonly choroplethData: readonly PixelChartRegionDatum[] = [
    { id: 'us', name: 'United States', value: 125_000_000 },
    { id: 'ca', name: 'Canada', value: 54_000_000 },
    { id: 'br', name: 'Brazil', value: 42_000_000 },
    { id: 'fr', name: 'France', value: 72_000_000 },
    { id: 'de', name: 'Germany', value: 92_000_000 },
    { id: 'in', name: 'India', value: 118_000_000 },
    { id: 'cn', name: 'China', value: 210_000_000 },
    { id: 'jp', name: 'Japan', value: 86_000_000 },
    { id: 'au', name: 'Australia', value: 32_000_000 },
  ];

  readonly areaData: readonly PixelChartRegionDatum[] = [
    { id: 'us', name: 'United States', category: 'Americas' },
    { id: 'ca', name: 'Canada', category: 'Americas' },
    { id: 'br', name: 'Brazil', category: 'Americas' },
    { id: 'fr', name: 'France', category: 'EMEA' },
    { id: 'de', name: 'Germany', category: 'EMEA' },
    { id: 'in', name: 'India', category: 'APAC' },
    { id: 'cn', name: 'China', category: 'APAC' },
    { id: 'jp', name: 'Japan', category: 'APAC' },
    { id: 'au', name: 'Australia', category: 'APAC' },
  ];

  readonly sitePoints: readonly PixelChartGeoPoint[] = [
    { id: 'nyc', name: 'New York', lon: -74, lat: 40.7, value: 82, size: 82, category: 'Warehouse' },
    { id: 'sao', name: 'São Paulo', lon: -46.6, lat: -23.5, value: 54, size: 54, category: 'Retail' },
    { id: 'lon', name: 'London', lon: -0.1, lat: 51.5, value: 71, size: 71, category: 'Office' },
    { id: 'mum', name: 'Mumbai', lon: 72.9, lat: 19.1, value: 66, size: 66, category: 'Warehouse' },
    { id: 'sha', name: 'Shanghai', lon: 121.5, lat: 31.2, value: 95, size: 95, category: 'Factory' },
    { id: 'syd', name: 'Sydney', lon: 151.2, lat: -33.9, value: 41, size: 41, category: 'Retail' },
    { id: 'tok', name: 'Tokyo', lon: 139.7, lat: 35.7, value: 88, size: 88, category: 'Office' },
  ];

  readonly heatPoints: readonly PixelChartGeoPoint[] = [
    { id: 'h1', name: 'NYC metro', lon: -74, lat: 40.7, value: 92 },
    { id: 'h2', name: 'London', lon: -0.1, lat: 51.5, value: 70 },
    { id: 'h3', name: 'Mumbai', lon: 72.9, lat: 19.1, value: 84 },
    { id: 'h4', name: 'Tokyo', lon: 139.7, lat: 35.7, value: 88 },
    { id: 'h5', name: 'Sydney', lon: 151.2, lat: -33.9, value: 42 },
    { id: 'h6', name: 'São Paulo', lon: -46.6, lat: -23.5, value: 61 },
  ];

  readonly routePoints: readonly PixelChartGeoPoint[] = [
    { id: 'nyc', name: 'New York', lon: -74, lat: 40.7 },
    { id: 'lon', name: 'London', lon: -0.1, lat: 51.5 },
    { id: 'dxb', name: 'Dubai', lon: 55.3, lat: 25.2 },
    { id: 'sin', name: 'Singapore', lon: 103.8, lat: 1.3 },
    { id: 'syd', name: 'Sydney', lon: 151.2, lat: -33.9 },
  ];

  readonly hubs: readonly PixelChartGeoPoint[] = [
    { id: 'hub', name: 'Frankfurt hub', lon: 8.7, lat: 50.1 },
    { id: 'nyc', name: 'New York', lon: -74, lat: 40.7 },
    { id: 'sao', name: 'São Paulo', lon: -46.6, lat: -23.5 },
    { id: 'jnb', name: 'Johannesburg', lon: 28.0, lat: -26.2 },
    { id: 'del', name: 'Delhi', lon: 77.2, lat: 28.6 },
    { id: 'sha', name: 'Shanghai', lon: 121.5, lat: 31.2 },
  ];

  readonly routeLinks: readonly PixelChartMapLink[] = [
    {
      id: 'r1',
      name: 'Eastbound',
      from: 'nyc',
      to: 'syd',
      waypoints: [
        { lon: -0.1, lat: 51.5 },
        { lon: 55.3, lat: 25.2 },
        { lon: 103.8, lat: 1.3 },
      ],
    },
  ];

  readonly flowLinks: readonly PixelChartMapLink[] = [
    { id: 'f1', name: 'Hub → NYC', from: 'hub', to: 'nyc', value: 120 },
    { id: 'f2', name: 'Hub → São Paulo', from: 'hub', to: 'sao', value: 64 },
    { id: 'f3', name: 'Hub → Johannesburg', from: 'hub', to: 'jnb', value: 38 },
    { id: 'f4', name: 'Hub → Delhi', from: 'hub', to: 'del', value: 95 },
    { id: 'f5', name: 'Hub → Shanghai', from: 'hub', to: 'sha', value: 110 },
  ];

  readonly activeValueScale = () => {
    const v = this.variant();
    if (v === 'choropleth') {
      return this.choroplethScale;
    }
    if (v === 'heatmap') {
      return this.heatScale;
    }
    return null;
  };

  readonly activeValueFormat = () =>
    this.variant() === 'choropleth' ? this.currencyFormat : null;

  readonly regionData = () => {
    const v = this.variant();
    if (v === 'area') {
      return this.areaData;
    }
    if (v === 'choropleth') {
      return this.choroplethData;
    }
    return [];
  };

  readonly pointData = () => {
    const v = this.variant();
    if (v === 'heatmap') {
      return this.heatPoints;
    }
    if (v === 'route') {
      return this.routePoints;
    }
    if (v === 'flow') {
      return this.hubs;
    }
    if (v === 'point' || v === 'bubble' || v === 'scatter' || v === 'symbol') {
      return this.sitePoints;
    }
    return [];
  };

  readonly linkData = () => {
    const v = this.variant();
    if (v === 'flow') {
      return this.flowLinks;
    }
    if (v === 'route') {
      return this.routeLinks;
    }
    return [];
  };

  readonly legendSeries = () => {
    const v = this.variant();
    if (v === 'area') {
      return mapRegionsToLegendSeries(this.areaData);
    }
    if (v === 'scatter' || v === 'symbol') {
      return mapPointsToLegendSeries(this.sitePoints);
    }
    return [];
  };

  readonly hiddenRegionIds = () => {
    if (this.variant() !== 'area') {
      return [];
    }
    const hiddenCats = new Set(this.hidden());
    return this.areaData
      .filter((d) => hiddenCats.has(d.category ?? d.id))
      .map((d) => d.id);
  };

  readonly table = computed(() => {
    // Recompute when variant / hidden / map instance change.
    this.variant();
    this.hidden();
    return (
      this.map()?.buildTable() ?? {
        columns: [],
        rows: [],
      }
    );
  });

  readonly isEmpty = () => {
    const v = this.variant();
    if (v === 'choropleth' || v === 'area') {
      return this.regionData().length === 0;
    }
    if (v === 'route' || v === 'flow') {
      return this.linkData().length === 0 && this.pointData().length < 2;
    }
    return this.pointData().length === 0;
  };

  readonly chartGetter = () => this.map()?.getChart() ?? null;

  constructor() {
    afterNextRender(() => {
      void this.loadWorldGeoJson();
    });
  }

  onVariant(value: unknown): void {
    if (
      value === 'choropleth' ||
      value === 'area' ||
      value === 'point' ||
      value === 'bubble' ||
      value === 'scatter' ||
      value === 'symbol' ||
      value === 'heatmap' ||
      value === 'route' ||
      value === 'flow'
    ) {
      this.variant.set(value);
      this.hidden.set([]);
    }
  }

  onAppearance(value: unknown): void {
    if (value === 'minimal' || value === 'soft' || value === 'emphasis') {
      this.appearance.set(value);
    }
  }

  private async loadWorldGeoJson(): Promise<void> {
    try {
      const url = new URL('maps/world.geojson', document.baseURI);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this.geoJson.set((await response.json()) as object);
    } catch (error) {
      this.loadError.set(
        error instanceof Error ? error.message : 'Unable to load map data',
      );
    }
  }
}
