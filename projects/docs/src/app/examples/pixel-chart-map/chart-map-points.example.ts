import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { PixelSelectComponent, type PixelSelectOption } from 'pixel-ui';
import {
  PixelChartMapComponent,
  PixelChartShellComponent,
  mapPointsToLegendSeries,
  type PixelChartGeoPoint,
  type PixelChartMapVariant,
} from 'pixel-ui/charts';

type PointMapVariant = Extract<
  PixelChartMapVariant,
  'point' | 'bubble' | 'scatter' | 'symbol'
>;

@Component({
  selector: 'docs-chart-map-points-example',
  imports: [PixelChartShellComponent, PixelChartMapComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      <pixel-select
        label="Variant"
        size="sm"
        [options]="variantOptions"
        [value]="variant()"
        (valueChange)="onVariant($event)"
      />
    </div>

    <pixel-chart-shell
      title="Map point layers"
      description="Point, bubble (size), scatter (size + category), and symbol markers on a registered world map."
      [series]="legendSeries()"
      [(hiddenSeriesIds)]="hidden"
      [empty]="!!loadError()"
      [emptyHeading]="'Map data unavailable'"
      [emptyDescription]="loadError() || 'Unable to load GeoJSON.'"
      [loading]="!geoJson() && !loadError()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [getChart]="chartGetter"
      exportFileName="geo-map-points"
    >
      @if (geoJson(); as mapGeoJson) {
        <pixel-chart-map
          #map
          [variant]="variant()"
          mapName="world"
          [geoJson]="mapGeoJson"
          [points]="points"
          [hiddenCategoryIds]="hidden()"
          [symbolMap]="symbolMap"
          [sizeScale]="sizeScale"
          [markerSize]="10"
          showValues="auto"
          roam
          height="380px"
          ariaLabel="Demo geographic point map"
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
export class ChartMapPointsExample {
  private readonly map = viewChild(PixelChartMapComponent);

  readonly geoJson = signal<object | null>(null);
  readonly loadError = signal('');
  readonly variant = signal<PointMapVariant>('bubble');
  readonly hidden = signal<string[]>([]);

  readonly variantOptions: readonly PixelSelectOption[] = [
    { value: 'point', label: 'point' },
    { value: 'bubble', label: 'bubble' },
    { value: 'scatter', label: 'scatter' },
    { value: 'symbol', label: 'symbol' },
  ];

  readonly sizeScale = { range: [10, 42] as const };

  readonly symbolMap: Readonly<Record<string, string>> = {
    Warehouse: 'rect',
    Factory: 'triangle',
    Retail: 'diamond',
    Office: 'pin',
  };

  readonly points: readonly PixelChartGeoPoint[] = [
    { id: 'nyc', name: 'New York', lon: -74.0, lat: 40.7, value: 82, size: 82, category: 'Warehouse' },
    { id: 'sao', name: 'São Paulo', lon: -46.6, lat: -23.5, value: 54, size: 54, category: 'Retail' },
    { id: 'lon', name: 'London', lon: -0.1, lat: 51.5, value: 71, size: 71, category: 'Office' },
    { id: 'lag', name: 'Lagos', lon: 3.4, lat: 6.5, value: 38, size: 38, category: 'Factory' },
    { id: 'mum', name: 'Mumbai', lon: 72.9, lat: 19.1, value: 66, size: 66, category: 'Warehouse' },
    { id: 'sha', name: 'Shanghai', lon: 121.5, lat: 31.2, value: 95, size: 95, category: 'Factory' },
    { id: 'syd', name: 'Sydney', lon: 151.2, lat: -33.9, value: 41, size: 41, category: 'Retail' },
    { id: 'tok', name: 'Tokyo', lon: 139.7, lat: 35.7, value: 88, size: 88, category: 'Office' },
  ];

  readonly legendSeries = () => {
    const v = this.variant();
    return v === 'scatter' || v === 'symbol'
      ? mapPointsToLegendSeries(this.points)
      : [];
  };

  readonly chartGetter = () => this.map()?.getChart() ?? null;

  readonly table = computed(() => {
    this.variant();
    this.hidden();
    return this.map()?.buildTable() ?? { columns: [], rows: [] };
  });

  constructor() {
    afterNextRender(() => {
      void this.loadWorldGeoJson();
    });
  }

  onVariant(value: unknown): void {
    if (
      value === 'point' ||
      value === 'bubble' ||
      value === 'scatter' ||
      value === 'symbol'
    ) {
      this.variant.set(value);
      this.hidden.set([]);
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
