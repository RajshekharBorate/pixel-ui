import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  signal,
  viewChild,
} from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelChartMapComponent,
  PixelChartShellComponent,
  mapRegionsToLegendSeries,
  type PixelChartRegionDatum,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-map-skeleton-example',
  imports: [PixelChartShellComponent, PixelChartMapComponent, PixelButtonComponent],
  template: `
    <div class="docs-chart-skeleton-demo">
      <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

      <pixel-chart-shell
        title="Skeleton states"
        description="Bind showSkeleton on shell (legend stubs) and the map (plot). Both flip together when data is ready."
        [series]="legendSeries()"
        [empty]="false"
        [showValueToggle]="false"
        [showSkeleton]="showSkeleton()"
        [getChart]="chartGetter"
        exportFileName="map-skeleton-demo"
      >
        <pixel-chart-map
          #map
          variant="area"
          mapName="world"
          [geoJson]="geoJson()"
          [data]="data"
          [showSkeleton]="showSkeleton()"
          height="380px"
          ariaLabel="Skeleton demo map"
        />
      </pixel-chart-shell>
    </div>
  `,
  styles: `
    .docs-chart-skeleton-demo {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartMapSkeletonExample {
  private readonly map = viewChild.required(PixelChartMapComponent);

  readonly geoJson = signal<object>({ type: 'FeatureCollection', features: [] });
  readonly showSkeleton = signal(true);

  readonly data: readonly PixelChartRegionDatum[] = [
    { id: 'us', name: 'United States', category: 'Americas' },
    { id: 'ca', name: 'Canada', category: 'Americas' },
    { id: 'br', name: 'Brazil', category: 'Americas' },
    { id: 'fr', name: 'France', category: 'EMEA' },
    { id: 'de', name: 'Germany', category: 'EMEA' },
    { id: 'in', name: 'India', category: 'APAC' },
    { id: 'cn', name: 'China', category: 'APAC' },
    { id: 'jp', name: 'Japan', category: 'APAC' },
  ];

  readonly legendSeries = () => mapRegionsToLegendSeries(this.data);
  readonly chartGetter = () => this.map()?.getChart() ?? null;

  constructor() {
    afterNextRender(() => {
      void this.loadWorldGeoJson();
    });
  }

  private async loadWorldGeoJson(): Promise<void> {
    try {
      const url = new URL('maps/world.geojson', document.baseURI);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this.geoJson.set((await response.json()) as object);
    } catch {
      // Keep skeleton demo usable without map assets.
      this.geoJson.set({ type: 'FeatureCollection', features: [] });
    }
  }
}
