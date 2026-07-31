import {
  drillLevelsToBreadcrumbItems,
  pushDrillLevel,
  truncateDrillLevels,
  type PixelChartDrillLevel,
  type PixelChartDrillLevelBase,
} from './chart-drill';

type Level = PixelChartDrillLevel<readonly number[]> & PixelChartDrillLevelBase;

function level(id: string, label: string, parentId?: string): Level {
  return { id, label, parentId, data: [1, 2, 3] };
}

describe('chart-drill helpers', () => {
  it('maps levels to breadcrumb items with last active', () => {
    const items = drillLevelsToBreadcrumbItems([
      level('root', 'All regions'),
      level('west', 'West', 'root'),
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual(
      expect.objectContaining({ id: 'root', label: 'All regions', active: false }),
    );
    expect(items[1]).toEqual(
      expect.objectContaining({
        id: 'west',
        label: 'West',
        active: true,
        data: { levelId: 'west', parentId: 'root' },
      }),
    );
  });

  it('truncates and pushes drill levels', () => {
    const root = level('root', 'All');
    const west = level('west', 'West', 'root');
    const sf = level('sf', 'San Francisco', 'west');
    const stack = pushDrillLevel(pushDrillLevel([root], west), sf);
    expect(stack.map((l) => l.id)).toEqual(['root', 'west', 'sf']);
    expect(truncateDrillLevels(stack, 1).map((l) => l.id)).toEqual(['root', 'west']);
    expect(pushDrillLevel(stack, sf)).toEqual(stack);
  });

  it('honors custom sameLevel equality', () => {
    const a = { id: 'x', label: 'X', mapName: 'a' };
    const b = { id: 'x', label: 'X', mapName: 'b' };
    const stack = pushDrillLevel([a], b, (c, n) => c.id === n.id && c.mapName === n.mapName);
    expect(stack).toHaveLength(2);
    expect(pushDrillLevel(stack, b, (c, n) => c.id === n.id && c.mapName === n.mapName)).toEqual(
      stack,
    );
  });
});
