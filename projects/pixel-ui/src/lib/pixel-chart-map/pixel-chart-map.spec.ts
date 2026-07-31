import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelChartMapComponent from './pixel-chart-map';
import {
  buildMapChartOption,
  buildMapLinksTable,
  buildMapPointsTable,
  buildMapSummary,
  buildMapTable,
  PIXEL_CHART_MAP_SIZE_RANGE,
  resolveMapLinkCoords,
} from '../pixel-chart/builders/map-option';

const SAMPLE_GEO = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'North' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 1],
            [1, 1],
            [1, 2],
            [0, 2],
            [0, 1],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'South' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
    },
  ],
};

describe('buildMapChartOption', () => {
  it('builds choropleth with visualMap and map series', () => {
    const opt = buildMapChartOption({
      variant: 'choropleth',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      data: [
        { id: 'n', name: 'North', value: 10 },
        { id: 's', name: 'South', value: 40 },
      ],
      valueScale: { type: 'continuous', unit: 'USD' },
    }) as Record<string, unknown>;
    expect(opt['visualMap']).toEqual(expect.objectContaining({ type: 'continuous' }));
    expect(opt['backgroundColor']).toBeTruthy();
    const series = opt['series'] as Record<string, unknown>[];
    expect(series[0]).toEqual(
      expect.objectContaining({ type: 'map', map: 'demo', roam: true }),
    );
    const itemStyle = series[0]!['itemStyle'] as { borderWidth: number };
    expect(itemStyle.borderWidth).toBeGreaterThan(0.5);
  });

  it('applies emphasis appearance chrome (stronger borders / shadow)', () => {
    const soft = buildMapChartOption({
      variant: 'choropleth',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      data: [{ id: 'n', name: 'North', value: 10 }],
      appearance: 'soft',
    }) as Record<string, unknown>;
    const emphasis = buildMapChartOption({
      variant: 'choropleth',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      data: [{ id: 'n', name: 'North', value: 10 }],
      appearance: 'emphasis',
    }) as Record<string, unknown>;
    const softBorder = (
      (soft['series'] as Record<string, unknown>[])[0]!['itemStyle'] as {
        borderWidth: number;
      }
    ).borderWidth;
    const emphBorder = (
      (emphasis['series'] as Record<string, unknown>[])[0]!['itemStyle'] as {
        borderWidth: number;
      }
    ).borderWidth;
    expect(emphBorder).toBeGreaterThan(softBorder);
    const emphHover = (
      (emphasis['series'] as Record<string, unknown>[])[0]!['emphasis'] as {
        itemStyle: { shadowBlur: number };
      }
    ).itemStyle.shadowBlur;
    expect(emphHover).toBeGreaterThan(0);
  });

  it('frames world maps when geoView boundingCoords are set', () => {
    const opt = buildMapChartOption({
      variant: 'choropleth',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      data: [{ id: 'n', name: 'North', value: 10 }],
      geoView: {
        boundingCoords: [
          [-168, -55],
          [195, 78],
        ],
      },
    }) as Record<string, unknown>;
    const series = opt['series'] as Record<string, unknown>[];
    expect(series[0]!['boundingCoords']).toEqual([
      [-168, -55],
      [195, 78],
    ]);
  });

  it('builds categorical area fills without visualMap', () => {
    const opt = buildMapChartOption({
      variant: 'area',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      data: [
        { id: 'n', name: 'North', category: 'A' },
        { id: 's', name: 'South', category: 'B' },
      ],
    }) as Record<string, unknown>;
    expect(opt['visualMap']).toBeUndefined();
    const series = opt['series'] as { data: { itemStyle: { areaColor: string } }[] }[];
    expect(series[0]!.data[0]!.itemStyle.areaColor).toBeTruthy();
  });

  it('builds summary and table', () => {
    const data = [{ id: 'n', name: 'North', value: 3, category: 'West' }];
    expect(buildMapSummary({ variant: 'choropleth', data, mapName: 'demo' })).toContain(
      'choropleth',
    );
    expect(buildMapTable(data).rows[0]).toEqual(
      expect.objectContaining({ id: 'n', category: 'West', value: 3 }),
    );
  });

  it('builds bubble scatter on geo with size scaling', () => {
    const opt = buildMapChartOption({
      variant: 'bubble',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      points: [
        { id: 'a', name: 'A', lon: 0.2, lat: 0.5, size: 0 },
        { id: 'b', name: 'B', lon: 0.8, lat: 1.5, size: 100 },
      ],
      sizeScale: { min: 0, max: 100, range: [12, 40] },
    }) as Record<string, unknown>;
    expect(opt['geo']).toEqual(expect.objectContaining({ map: 'demo' }));
    const series = opt['series'] as { type: string; data: { symbolSize: number }[] }[];
    expect(series[0]!.type).toBe('scatter');
    expect(series[0]!.data[0]!.symbolSize).toBe(12);
    expect(series[0]!.data[1]!.symbolSize).toBe(40);
  });

  it('hides points by category id for scatter', () => {
    const opt = buildMapChartOption({
      variant: 'scatter',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      points: [
        { id: 'a', name: 'A', lon: 0.2, lat: 0.5, size: 20, category: 'Warehouse' },
        { id: 'b', name: 'B', lon: 0.8, lat: 1.5, size: 40, category: 'Retail' },
      ],
      hiddenCategoryIds: new Set(['Retail']),
      sizeScale: { range: PIXEL_CHART_MAP_SIZE_RANGE },
    }) as Record<string, unknown>;
    const series = opt['series'] as { data: { id?: string; category?: string }[] }[];
    expect(series[0]!.data).toHaveLength(1);
    expect(series[0]!.data[0]).toEqual(
      expect.objectContaining({ id: 'a', category: 'Warehouse' }),
    );
  });

  it('maps symbol variant category to custom symbols', () => {
    const opt = buildMapChartOption({
      variant: 'symbol',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      points: [{ id: 'a', name: 'A', lon: 0.2, lat: 0.5, category: 'Factory' }],
      symbolMap: { Factory: 'triangle' },
    }) as Record<string, unknown>;
    const series = opt['series'] as { data: { symbol: string }[] }[];
    expect(series[0]!.data[0]!.symbol).toBe('triangle');
  });

  it('builds points table', () => {
    const table = buildMapPointsTable([
      { id: 'a', name: 'A', lon: 1, lat: 2, value: 3, size: 4, category: 'X' },
    ]);
    expect(table.rows[0]).toEqual(
      expect.objectContaining({ id: 'a', lon: 1, lat: 2, category: 'X', size: 4 }),
    );
  });

  it('builds heatmap with visualMap and intensity points', () => {
    const opt = buildMapChartOption({
      variant: 'heatmap',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      points: [
        { id: 'a', lon: 0.2, lat: 0.5, value: 10 },
        { id: 'b', lon: 0.8, lat: 1.5, value: 90 },
      ],
      heatmapBlur: 18,
      heatmapPointSize: 24,
      valueScale: { type: 'continuous' },
    }) as Record<string, unknown>;
    expect(opt['visualMap']).toEqual(expect.objectContaining({ type: 'continuous' }));
    const series = opt['series'] as {
      type: string;
      blurSize: number;
      pointSize: number;
      minOpacity: number;
      data: unknown[];
    }[];
    expect(series[0]).toEqual(
      expect.objectContaining({
        type: 'heatmap',
        blurSize: 18,
        pointSize: 24,
        minOpacity: 0.3,
      }),
    );
    expect(series[0]!.data).toHaveLength(2);
  });

  it('resolves link geometry from point ids and waypoints', () => {
    const coords = resolveMapLinkCoords(
      {
        id: 'l1',
        from: 'a',
        to: 'c',
        waypoints: [{ lon: 0.5, lat: 1 }],
      },
      [
        { id: 'a', lon: 0, lat: 0 },
        { id: 'c', lon: 1, lat: 2 },
      ],
    );
    expect(coords).toEqual([
      [0, 0],
      [0.5, 1],
      [1, 2],
    ]);
  });

  it('builds flow lines with volume-scaled width', () => {
    const opt = buildMapChartOption({
      variant: 'flow',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      points: [
        { id: 'hub', lon: 0.5, lat: 1 },
        { id: 'a', lon: 0.1, lat: 0.2 },
        { id: 'b', lon: 0.9, lat: 1.8 },
      ],
      links: [
        { id: 'f1', from: 'hub', to: 'a', value: 10 },
        { id: 'f2', from: 'hub', to: 'b', value: 100 },
      ],
      lineWidthScale: { min: 10, max: 100, range: [2, 12] },
    }) as Record<string, unknown>;
    const series = opt['series'] as {
      type: string;
      polyline: boolean;
      symbol: string[];
      data: { lineStyle: { width: number; curveness: number }; coords: number[][] }[];
    }[];
    expect(series[0]!.type).toBe('lines');
    expect(series[0]!.data[0]!.lineStyle.width).toBe(5);
    expect(series[1]!.data[0]!.lineStyle.width).toBe(2);
    expect(series[1]!.data[1]!.lineStyle.width).toBe(12);
    expect(series[1]!.data[0]!.lineStyle.curveness).toBe(0.24);
    expect(series[1]!.data[0]!.coords.length).toBe(2);
    expect(series[1]!.polyline).toBe(false);
    expect(series[1]!.symbol).toEqual(['none', 'arrow']);
    expect(series[2]!.type).toBe('scatter');
  });

  it('builds route markers and links table', () => {
    const points = [
      { id: 'o', lon: 0, lat: 0 },
      { id: 'd', lon: 1, lat: 1 },
    ];
    const links = [
      {
        id: 'r1',
        name: 'Trip',
        from: 'o',
        to: 'd',
        waypoints: [{ lon: 0.5, lat: 0.25 }],
        value: 1,
      },
    ];
    const opt = buildMapChartOption({
      variant: 'route',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      points,
      links,
    }) as Record<string, unknown>;
    const series = opt['series'] as { type: string; data: unknown[] }[];
    expect(series[0]!.type).toBe('lines');
    expect(series[1]!.type).toBe('lines');
    expect(series[2]!.type).toBe('scatter');
    expect(series[2]!.data.length).toBe(3);
    const table = buildMapLinksTable(links, points);
    expect(table.rows[0]).toEqual(
      expect.objectContaining({
        id: 'r1',
        fromLon: 0,
        toLon: 1,
        waypoints: 1,
        value: 1,
      }),
    );
    expect(buildMapSummary({ variant: 'flow', links, mapName: 'demo' })).toContain('1 links');
  });

  it('includes value range in screen-reader summary', () => {
    expect(
      buildMapSummary({
        variant: 'choropleth',
        mapName: 'demo',
        data: [
          { id: 'a', name: 'A', value: 10 },
          { id: 'b', name: 'B', value: 40 },
        ],
      }),
    ).toContain('values 10 to 40');
  });

  it('applies geoView boundingCoords on choropleth map series', () => {
    const opt = buildMapChartOption({
      variant: 'choropleth',
      mapName: 'demo',
      geoJson: SAMPLE_GEO,
      data: [{ id: 'n', name: 'North', value: 10 }],
      geoView: {
        boundingCoords: [
          [0, 0],
          [1, 2],
        ],
      },
    }) as Record<string, unknown>;
    const series = opt['series'] as Record<string, unknown>[];
    expect(series[0]).toEqual(
      expect.objectContaining({
        type: 'map',
        boundingCoords: [
          [0, 0],
          [1, 2],
        ],
      }),
    );
  });
});

describe('pixel-chart-map', () => {
  let fixture: ComponentFixture<PixelChartMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PixelChartMapComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PixelChartMapComponent);
    // Avoid ECharts geo layout in jsdom (zero-size plot). Option builder is covered above.
    fixture.componentRef.setInput('mapName', '');
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
  });

  it('renders host with choropleth default', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.getAttribute('data-variant')).toBe('choropleth');
    expect(el.querySelector('pixel-chart-host')).toBeTruthy();
  });
});
