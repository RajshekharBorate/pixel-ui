import { DocComponentMeta } from '../types';
import { CHART_MAP_EXAMPLES } from '../../examples/pixel-chart-map';

export const CHART_MAP_META: DocComponentMeta = {
  id: 'pixel-chart-map',
  title: 'Chart — Map',
  selector: 'pixel-chart-map',
  category: 'charts',
  status: 'stable',
  summary:
    'Geographic maps: region fills, point layers, heatmap, route, and flow — all nine mockup variants.',
  overview: [
    'pixel-chart-map renders GeoJSON registered under mapName.',
    'Region: choropleth / area. Points: point / bubble / scatter / symbol.',
    'Density & paths: heatmap, route, and flow.',
    'Drill-down is consumer-owned: push child GeoJSON on regionClick and drive pixel-breadcrumb with mapDrillLevelsToBreadcrumbItems.',
    'Compose with pixel-chart-shell for legend, loading/empty, and PNG/SVG/PDF/CSV export.',
    'Apps supply GeoJSON — pixel-ui does not ship a world atlas. Import from pixel-ui/charts.',
  ],
  useCases: [
    'Sales by country / region (choropleth)',
    'Territory / org regions (categorical area)',
    'World → country → state drill-down with breadcrumb',
    'Store / facility locations (point / symbol)',
    'Volume by site (bubble / geo scatter)',
    'Activity density (heatmap)',
    'Shipping / travel routes and hub flows',
  ],
  themingNotes: [
    'No-data and borders use outline tokens; choropleth / heatmap ramps from palette + visualMap.',
    'Point markers and flow arcs use palette colors; symbol map can override ECharts shapes.',
  ],
  accessibilityNotes: [
    'role="img" with ariaLabel; live summary of variant, counts, and value range.',
    'Use buildMapTable / buildMapPointsTable / buildMapLinksTable (or facade buildTable) with shell CSV.',
    'Roam is pointer-oriented; shell toolbar and breadcrumb (for drill-up) remain keyboard-reachable.',
  ],
  imports: [
    'PixelChartMapComponent',
    'PixelChartShellComponent',
    'registerPixelChartMap',
    'mapDrillLevelsToBreadcrumbItems',
  ],  inputs: [
    {
      name: 'variant',
      type: "'choropleth' | 'area' | 'point' | 'bubble' | 'scatter' | 'symbol' | 'heatmap' | 'route' | 'flow'",
      defaultValue: "'choropleth'",
      description: 'Map visualization mode.',
    },
    {
      name: 'mapName',
      type: 'string',
      defaultValue: "''",
      description: 'ECharts registerMap name.',
    },
    {
      name: 'geoJson',
      type: 'object | null',
      defaultValue: 'null',
      description: 'Optional GeoJSON registered under mapName.',
    },
    {
      name: 'data',
      type: 'readonly PixelChartRegionDatum[]',
      defaultValue: '[]',
      description: 'Region values / categories.',
    },
    {
      name: 'points',
      type: 'readonly PixelChartGeoPoint[]',
      defaultValue: '[]',
      description: 'Lon/lat points (layers, heatmap, link id resolution).',
    },
    {
      name: 'links',
      type: 'readonly PixelChartMapLink[]',
      defaultValue: '[]',
      description: 'Directed links for route / flow.',
    },
    {
      name: 'geoView',
      type: 'PixelChartMapGeoView | null',
      defaultValue: 'null',
      description: 'Optional camera (boundingCoords / center / zoom) for drill-in.',
    },
    {
      name: 'syncGroup',
      type: 'string',
      defaultValue: "''",
      description: 'Cross-chart sync group (host).',
    },
  ],
  outputs: [
    {
      name: 'regionClick',
      type: 'PixelChartRegionClickEvent',
      description: 'Region activated.',
    },
    {
      name: 'pointClick',
      type: 'PixelChartMapPointClickEvent',
      description: 'Point / heatmap sample activated.',
    },
    {
      name: 'linkClick',
      type: 'PixelChartMapLinkClickEvent',
      description: 'Route / flow link activated.',
    },
  ],
  examples: CHART_MAP_EXAMPLES,
};
