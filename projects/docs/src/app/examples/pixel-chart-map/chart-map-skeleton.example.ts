import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelChartMapComponent,
  PixelChartShellComponent,
  type PixelChartRegionDatum,
} from 'pixel-ui/charts';

/** Minimal FeatureCollection so the map facade can mount while skeleton is toggled. */
const EMPTY_GEO: object = { type: 'FeatureCollection', features: [] };

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
        description="Bind showSkeleton on the chart facade (like pixel-select). Shell chrome stays; the plot is replaced."
        [series]="[]"
        [empty]="false"
        [showValueToggle]="false"
        [getChart]="chartGetter"
        exportFileName="map-skeleton-demo"
      >
        <pixel-chart-map
          #map
          variant="choropleth"
          mapName="docs-skeleton"
          [geoJson]="geoJson"
          [data]="data"
          [showSkeleton]="showSkeleton()"
          height="280px"
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

  readonly geoJson = EMPTY_GEO;
  readonly data: readonly PixelChartRegionDatum[] = [];
  readonly showSkeleton = signal(true);

  readonly chartGetter = () => this.map()?.getChart() ?? null;
}
