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
  mapRegionsToLegendSeries,
  type PixelChartMapVariant,
  type PixelChartRegionDatum,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-map-basic-example',
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
      title="Geographic map"
      description="Choropleth (value ramp via visualMap) and categorical area fills. GeoJSON is registered from docs — not shipped in pixel-ui."
      [series]="legendSeries()"
      [(hiddenSeriesIds)]="hidden"
      [empty]="!!loadError()"
      [emptyHeading]="'Map data unavailable'"
      [emptyDescription]="loadError() || 'Unable to load GeoJSON.'"
      [loading]="!geoJson() && !loadError()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [getChart]="chartGetter"
      exportFileName="geo-map"
    >
      @if (geoJson(); as mapGeoJson) {
        <pixel-chart-map
          #map
          [variant]="variant()"
          mapName="world"
          [geoJson]="mapGeoJson"
          [data]="data()"
          [hiddenRegionIds]="hiddenRegionIds()"
          [valueScale]="valueScale"
          [valueFormat]="currencyFormat"
          roam
          height="380px"
          ariaLabel="Demo geographic map"
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
export class ChartMapBasicExample {
  private readonly map = viewChild(PixelChartMapComponent);

  readonly geoJson = signal<object | null>(null);
  readonly loadError = signal('');
  readonly variant = signal<PixelChartMapVariant>('choropleth');
  readonly hidden = signal<string[]>([]);

  readonly variantOptions: readonly PixelSelectOption[] = [
    { value: 'choropleth', label: 'choropleth' },
    { value: 'area', label: 'area' },
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
