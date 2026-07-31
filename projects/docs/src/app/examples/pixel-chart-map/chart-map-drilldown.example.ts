import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { PixelButtonComponent, PixelBreadcrumbComponent,
  type PixelBreadcrumbClickEvent,
  type PixelBreadcrumbItem,
 } from 'pixel-ui';
import {
  PixelChartMapComponent,
  PixelChartShellComponent,
  PIXEL_CHART_MAP_WORLD_GEO_VIEW,
  computeGeoJsonBoundingCoords,
  mapDrillLevelsToBreadcrumbItems,
  pushMapDrillLevel,
  truncateMapDrillLevels,
  type PixelChartMapDrillLevel,
  type PixelChartRegionClickEvent,
  type PixelChartRegionDatum,
} from 'pixel-ui/charts';

type ChildAtlas = {
  readonly mapName: string;
  readonly url: string;
  readonly data: readonly PixelChartRegionDatum[];
};

@Component({
  selector: 'docs-chart-map-drilldown-example',
  imports: [PixelButtonComponent, PixelBreadcrumbComponent, PixelChartShellComponent, PixelChartMapComponent],
  template: `
    <div class="docs-chart-skeleton-demo">

    <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

    <pixel-chart-shell
      title="Geographic drill-down"
      description="Click United States or India to drill in. California opens a third level. Breadcrumb drills up; CSV export reflects the current level."
      [series]="[]"
      [(showValues)]="showValues"
      [empty]="!!loadError() && !current()"
      [emptyHeading]="'Map data unavailable'"
      [emptyDescription]="loadError() || 'Unable to load GeoJSON.'"
      [loading]="loading()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [getChart]="chartGetter"
      [exportBreadcrumb]="exportBreadcrumb()"
      exportFileName="geo-map-drilldown"
     [showSkeleton]="showSkeleton()">
      @if (levels().length > 1) {
        <div pixelChartHeader class="drill-navigation">
          <pixel-breadcrumb
            type="collapsed"
            size="sm"
            [items]="breadcrumbItems()"
            [maxVisibleItems]="4"
            (itemClick)="onBreadcrumb($event)"
          />
        </div>
      }

      @if (current(); as level) {
        <pixel-chart-map
          #map
          variant="choropleth"
          [mapName]="level.mapName"
          [geoJson]="level.geoJson"
          [data]="level.data"
          [geoView]="level.geoView ?? null"
          [valueScale]="valueScale"
          [valueFormat]="currencyFormat"
          [showValues]="showValues()"
          roam
          height="400px"
          ariaLabel="Geographic drill-down map"
          (regionClick)="onRegionClick($event)"
         [showSkeleton]="showSkeleton()" />
      }
    </pixel-chart-shell>
    <span class="status-announcement" role="status">{{ status() }}</span>
    </div>
  `,
  styles: `
    .docs-chart-skeleton-demo {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
      position: relative;
    }

    .drill-navigation {
      display: block;
    }

    .status-announcement {
      position: absolute;
      inline-size: 0;
      block-size: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartMapDrilldownExample {
  readonly showSkeleton = signal(false);

  private readonly map = viewChild(PixelChartMapComponent);

  readonly showValues = signal(false);

  readonly levels = signal<readonly PixelChartMapDrillLevel[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly status = signal('Loading world map…');

  readonly currencyFormat = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  } as const;

  readonly valueScale = {
    type: 'piecewise' as const,
    unit: 'USD',
    pieces: [
      { max: 1_000_000, label: '< 1M' },
      { min: 1_000_000, max: 10_000_000, label: '1–10M' },
      { min: 10_000_000, max: 50_000_000, label: '10–50M' },
      { min: 50_000_000, label: '> 50M' },
    ],
  };

  readonly worldData: readonly PixelChartRegionDatum[] = [
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

  readonly usData: readonly PixelChartRegionDatum[] = [
    { id: 'ca', name: 'California', value: 48_000_000 },
    { id: 'tx', name: 'Texas', value: 36_000_000 },
    { id: 'ny', name: 'New York', value: 28_000_000 },
    { id: 'fl', name: 'Florida', value: 22_000_000 },
    { id: 'il', name: 'Illinois', value: 14_000_000 },
  ];

  readonly caData: readonly PixelChartRegionDatum[] = [
    { id: 'los-angeles', name: 'Los Angeles', value: 21_300_000 },
    { id: 'san-diego', name: 'San Diego', value: 12_400_000 },
    { id: 'orange', name: 'Orange', value: 8_200_000 },
    { id: 'santa-clara', name: 'Santa Clara', value: 6_100_000 },
    { id: 'alameda', name: 'Alameda', value: 4_800_000 },
    { id: 'sacramento', name: 'Sacramento', value: 3_900_000 },
  ];

  readonly indiaData: readonly PixelChartRegionDatum[] = [
    { id: 'maharashtra', name: 'Maharashtra', value: 31_000_000 },
    { id: 'delhi', name: 'Delhi', value: 28_000_000 },
    { id: 'karnataka', name: 'Karnataka', value: 26_000_000 },
    { id: 'tamil-nadu', name: 'Tamil Nadu', value: 19_000_000 },
    { id: 'west-bengal', name: 'West Bengal', value: 14_000_000 },
    { id: 'gujarat', name: 'Gujarat', value: 12_000_000 },
  ];

  /** Parent region name (world / US) → child atlas. */
  private readonly childrenByRegion: Readonly<Record<string, ChildAtlas>> = {
    'United States': {
      mapName: 'us-states',
      url: 'maps/us-states.geojson',
      data: this.usData,
    },
    California: {
      mapName: 'us-ca-regions',
      url: 'maps/us-ca-regions.geojson',
      data: this.caData,
    },
    India: {
      mapName: 'india-regions',
      url: 'maps/india-regions.geojson',
      data: this.indiaData,
    },
  };

  readonly current = computed(() => {
    const stack = this.levels();
    return stack[stack.length - 1] ?? null;
  });

  readonly breadcrumbItems = computed(
    () => mapDrillLevelsToBreadcrumbItems(this.levels()) as readonly PixelBreadcrumbItem[],
  );

  readonly exportBreadcrumb = computed(() => {
    const levels = this.levels();
    return levels.length > 1 ? levels.map((level) => level.label) : [];
  });

  readonly table = computed(() => {
    this.levels();
    return this.map()?.buildTable() ?? { columns: [], rows: [] };
  });

  readonly chartGetter = () => this.map()?.getChart() ?? null;

  constructor() {
    afterNextRender(() => {
      void this.bootstrapWorld();
    });
  }

  async onRegionClick(event: PixelChartRegionClickEvent): Promise<void> {
    const key = event.regionName || event.regionId;
    const child = this.childrenByRegion[key];
    if (!child) {
      this.status.set(`${key} has no further drill levels in this demo.`);
      return;
    }
    this.loading.set(true);
    this.status.set(`Loading ${key}…`);
    try {
      const geoJson = await this.fetchGeoJson(child.url);
      const next: PixelChartMapDrillLevel = {
        id: child.mapName,
        label: key,
        mapName: child.mapName,
        geoJson,
        data: child.data,
        parentRegionId: event.regionId,
        geoView: {
          boundingCoords: computeGeoJsonBoundingCoords(geoJson) ?? undefined,
        },
      };
      this.levels.update((stack) => pushMapDrillLevel(stack, next));
      this.status.set(`Showing ${key}. Use the breadcrumb to drill up.`);
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : 'Unable to load child map');
      this.status.set(this.loadError());
    } finally {
      this.loading.set(false);
    }
  }

  onBreadcrumb(event: PixelBreadcrumbClickEvent): void {
    if (event.isLast) {
      return;
    }
    this.levels.update((stack) => truncateMapDrillLevels(stack, event.index));
    const current = this.levels()[event.index];
    this.status.set(
      current ? `Returned to ${current.label}.` : 'Returned to world.',
    );
  }

  private async bootstrapWorld(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const geoJson = await this.fetchGeoJson('maps/world.geojson');
      this.levels.set([
        {
          id: 'world',
          label: 'World',
          mapName: 'world',
          geoJson,
          data: this.worldData,
          geoView: PIXEL_CHART_MAP_WORLD_GEO_VIEW,
        },
      ]);
      this.status.set(
        'Click United States or India to drill down. California opens a third level.',
      );
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : 'Unable to load world map');
      this.status.set(this.loadError());
    } finally {
      this.loading.set(false);
    }
  }

  private async fetchGeoJson(relativePath: string): Promise<object> {
    const url = new URL(relativePath, document.baseURI);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${relativePath}`);
    }
    return (await response.json()) as object;
  }
}
