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
  type PixelChartGeoPoint,
  type PixelChartMapLink,
  type PixelChartMapVariant,
} from 'pixel-ui/charts';

type DensityMapVariant = Extract<PixelChartMapVariant, 'heatmap' | 'route' | 'flow'>;

@Component({
  selector: 'docs-chart-map-density-example',
  imports: [PixelButtonComponent, PixelChartShellComponent, PixelChartMapComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      
      <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>
<pixel-select
        label="Variant"
        size="sm"
        [options]="variantOptions"
        [value]="variant()"
        (valueChange)="onVariant($event)"
      />
    </div>

    <pixel-chart-shell
      title="Heatmap · route · flow"
      description="Intensity heatmap, route polylines with stop markers, and curved flow links sized by volume."
      [series]="[]"
      [(showValues)]="showValues"
      [empty]="!!loadError()"
      [emptyHeading]="'Map data unavailable'"
      [emptyDescription]="loadError() || 'Unable to load GeoJSON.'"
      [loading]="!showSkeleton() && !geoJson() && !loadError()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [getChart]="chartGetter"
      exportFileName="geo-map-density"
     [showSkeleton]="showSkeleton()">
      @if (geoJson() || showSkeleton()) {
        <pixel-chart-map
          #map
          [variant]="variant()"
          mapName="world"
          [geoJson]="geoJson() ?? emptyGeoJson"
          [points]="activePoints()"
          [links]="activeLinks()"
          [valueScale]="valueScale"
          [lineWidthScale]="lineWidthScale"
          [heatmapBlur]="22"
          [heatmapPointSize]="22"
          [showValues]="showValues()"
          roam
          [geoView]="worldView"
          height="380px"
          ariaLabel="Demo geographic density and path map"
          [showSkeleton]="showSkeleton()"
        />
      }
    </pixel-chart-shell>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--pixel-sys-space-md, 1rem);
      margin-block-end: var(--pixel-sys-space-md, 1rem);
      max-inline-size: 16rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartMapDensityExample {
  readonly showSkeleton = signal(false);

  private readonly map = viewChild(PixelChartMapComponent);

  readonly emptyGeoJson: object = { type: 'FeatureCollection', features: [] };
  readonly geoJson = signal<object | null>(null);
  readonly loadError = signal('');
  readonly variant = signal<DensityMapVariant>('heatmap');
  readonly showValues = signal(false);
  readonly worldView = PIXEL_CHART_MAP_WORLD_GEO_VIEW;

  readonly variantOptions: readonly PixelSelectOption[] = [
    { value: 'heatmap', label: 'heatmap' },
    { value: 'route', label: 'route' },
    { value: 'flow', label: 'flow' },
  ];

  readonly valueScale = { type: 'continuous' as const, unit: 'idx' };

  readonly lineWidthScale = { range: [1.5, 6] as const };

  readonly heatPoints: readonly PixelChartGeoPoint[] = [
    { id: 'h1', name: 'NYC metro', lon: -74, lat: 40.7, value: 92 },
    { id: 'h2', name: 'Chicago', lon: -87.6, lat: 41.9, value: 61 },
    { id: 'h3', name: 'LA basin', lon: -118.2, lat: 34.1, value: 78 },
    { id: 'h4', name: 'London', lon: -0.1, lat: 51.5, value: 70 },
    { id: 'h5', name: 'Paris', lon: 2.3, lat: 48.9, value: 55 },
    { id: 'h6', name: 'Frankfurt', lon: 8.7, lat: 50.1, value: 48 },
    { id: 'h7', name: 'Mumbai', lon: 72.9, lat: 19.1, value: 84 },
    { id: 'h8', name: 'Singapore', lon: 103.8, lat: 1.3, value: 66 },
    { id: 'h9', name: 'Tokyo', lon: 139.7, lat: 35.7, value: 88 },
    { id: 'h10', name: 'Sydney', lon: 151.2, lat: -33.9, value: 42 },
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

  readonly flowLinks: readonly PixelChartMapLink[] = [
    { id: 'f1', name: 'Hub → NYC', from: 'hub', to: 'nyc', value: 120 },
    { id: 'f2', name: 'Hub → São Paulo', from: 'hub', to: 'sao', value: 64 },
    { id: 'f3', name: 'Hub → Johannesburg', from: 'hub', to: 'jnb', value: 38 },
    { id: 'f4', name: 'Hub → Delhi', from: 'hub', to: 'del', value: 95 },
    { id: 'f5', name: 'Hub → Shanghai', from: 'hub', to: 'sha', value: 110 },
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

  readonly activePoints = () => {
    const v = this.variant();
    if (v === 'heatmap') {
      return this.heatPoints;
    }
    if (v === 'route') {
      return this.routePoints;
    }
    return this.hubs;
  };

  readonly activeLinks = () => {
    const v = this.variant();
    if (v === 'flow') {
      return this.flowLinks;
    }
    if (v === 'route') {
      return this.routeLinks;
    }
    return [];
  };

  readonly chartGetter = () => this.map()?.getChart() ?? null;

  readonly table = computed(() => {
    this.variant();
    return this.map()?.buildTable() ?? { columns: [], rows: [] };
  });

  constructor() {
    afterNextRender(() => {
      void this.loadWorldGeoJson();
    });
  }

  onVariant(value: unknown): void {
    if (value === 'heatmap' || value === 'route' || value === 'flow') {
      this.variant.set(value);
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
      this.loadError.set(error instanceof Error ? error.message : 'Unable to load map data');
    }
  }
}
