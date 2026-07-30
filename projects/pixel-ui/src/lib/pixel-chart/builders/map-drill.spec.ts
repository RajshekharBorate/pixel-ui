import {
  computeGeoJsonBoundingCoords,
  mapDrillLevelsToBreadcrumbItems,
  pushMapDrillLevel,
  truncateMapDrillLevels,
  type PixelChartMapDrillLevel,
} from './map-drill';

const sampleGeo = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'A' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
    },
  ],
};

function level(
  id: string,
  label: string,
  extras: Partial<PixelChartMapDrillLevel> = {},
): PixelChartMapDrillLevel {
  return {
    id,
    label,
    mapName: id,
    geoJson: sampleGeo,
    data: [{ id: 'a', name: 'A', value: 1 }],
    ...extras,
  };
}

describe('map-drill helpers', () => {
  it('maps levels to breadcrumb items with last active', () => {
    const items = mapDrillLevelsToBreadcrumbItems([
      level('world', 'World'),
      level('us', 'United States', { parentRegionId: 'us' }),
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual(
      expect.objectContaining({ id: 'world', label: 'World', active: false }),
    );
    expect(items[1]).toEqual(
      expect.objectContaining({
        id: 'us',
        label: 'United States',
        active: true,
        data: expect.objectContaining({ levelId: 'us', parentRegionId: 'us' }),
      }),
    );
  });

  it('truncates and pushes drill levels', () => {
    const root = level('world', 'World');
    const us = level('us', 'United States');
    const ca = level('ca', 'California');
    const stack = pushMapDrillLevel(pushMapDrillLevel([root], us), ca);
    expect(stack.map((l) => l.id)).toEqual(['world', 'us', 'ca']);
    expect(truncateMapDrillLevels(stack, 1).map((l) => l.id)).toEqual(['world', 'us']);
    expect(pushMapDrillLevel(stack, ca)).toEqual(stack);
  });

  it('computes bounding coords from GeoJSON', () => {
    expect(computeGeoJsonBoundingCoords(sampleGeo)).toEqual([
      [expect.any(Number), expect.any(Number)],
      [expect.any(Number), expect.any(Number)],
    ]);
    const box = computeGeoJsonBoundingCoords(sampleGeo, 0)!;
    expect(box[0]![0]).toBeLessThanOrEqual(0);
    expect(box[1]![0]).toBeGreaterThanOrEqual(2);
  });
});
