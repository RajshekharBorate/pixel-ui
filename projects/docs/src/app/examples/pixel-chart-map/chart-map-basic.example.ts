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
  mapRegionsToLegendSeries,
  type PixelChartMapAppearance,
  type PixelChartMapVariant,
  type PixelChartRegionDatum,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-map-basic-example',
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
      title="Geographic map"
      description="Choropleth (value ramp via visualMap) and categorical area fills. Appearance presets tune ocean/land chrome and hover elevation. GeoJSON is registered from docs — not shipped in pixel-ui."
      [series]="legendSeries()"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [empty]="!!loadError()"
      [emptyHeading]="'Map data unavailable'"
      [emptyDescription]="loadError() || 'Unable to load GeoJSON.'"
      [loading]="!showSkeleton() && !geoJson() && !loadError()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [getChart]="chartGetter"
      exportFileName="geo-map"
     [showSkeleton]="showSkeleton()">
      @if (geoJson() || showSkeleton()) {
        <pixel-chart-map
          #map
          [variant]="variant()"
          [appearance]="appearance()"
          mapName="world"
          [geoJson]="geoJson() ?? emptyGeoJson"
          [data]="data()"
          [hiddenRegionIds]="hiddenRegionIds()"
          [valueScale]="valueScale"
          [valueFormat]="currencyFormat"
          [showValues]="showValues()"
          [geoView]="worldView"
          roam
          height="380px"
          ariaLabel="Demo geographic map"
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
export class ChartMapBasicExample {
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

  readonly valueScale = {
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

  readonly choroplethData: readonly PixelChartRegionDatum[] = [
    { id: 'us', name: 'United States', value: 125_000_000 },
    { id: 'ca', name: 'Canada', value: 54_000_000 },
    { id: 'br', name: 'Brazil', value: 42_000_000 },
    { id: 'ar', name: 'Argentina', value: 18_000_000 },
    { id: 'fr', name: 'France', value: 72_000_000 },
    { id: 'de', name: 'Germany', value: 92_000_000 },
    { id: 'ng', name: 'Nigeria', value: 8_500_000 },
    { id: 'za', name: 'South Africa', value: 14_000_000 },
    { id: 'in', name: 'India', value: 118_000_000 },
    { id: 'cn', name: 'China', value: 210_000_000 },
    { id: 'jp', name: 'Japan', value: 86_000_000 },
    { id: 'au', name: 'Australia', value: 32_000_000 },
  ];

  readonly areaData: readonly PixelChartRegionDatum[] = [
    { id: 'us', name: 'United States', category: 'Americas' },
    { id: 'ca', name: 'Canada', category: 'Americas' },
    { id: 'br', name: 'Brazil', category: 'Americas' },
    { id: 'ar', name: 'Argentina', category: 'Americas' },
    { id: 'fr', name: 'France', category: 'EMEA' },
    { id: 'de', name: 'Germany', category: 'EMEA' },
    { id: 'ng', name: 'Nigeria', category: 'EMEA' },
    { id: 'za', name: 'South Africa', category: 'EMEA' },
    { id: 'in', name: 'India', category: 'APAC' },
    { id: 'cn', name: 'China', category: 'APAC' },
    { id: 'jp', name: 'Japan', category: 'APAC' },
    { id: 'au', name: 'Australia', category: 'APAC' },
  ];

  readonly data = () => (this.variant() === 'area' ? this.areaData : this.choroplethData);

  readonly legendSeries = () =>
    this.variant() === 'area' ? mapRegionsToLegendSeries(this.areaData) : [];

  /** Area legend hides by category id; choropleth uses visualMap (no shell series). */
  readonly hiddenRegionIds = () => {
    if (this.variant() !== 'area') {
      return [];
    }
    const hiddenCats = new Set(this.hidden());
    return this.areaData.filter((d) => hiddenCats.has(d.category ?? d.id)).map((d) => d.id);
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
    if (value === 'choropleth' || value === 'area') {
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
      this.loadError.set(error instanceof Error ? error.message : 'Unable to load map data');
    }
  }
}
