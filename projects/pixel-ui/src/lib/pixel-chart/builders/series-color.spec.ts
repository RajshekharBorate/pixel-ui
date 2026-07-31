import { resolveStableColorMap, resolveStableItemColor } from './series-color';

const ITEMS = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C', color: '#ff0000' },
] as const;

const PALETTE = ['#111111', '#222222', '#333333', '#444444'] as const;

describe('resolveStableItemColor', () => {
  it('uses full-list index for each id', () => {
    expect(resolveStableItemColor(ITEMS[0]!, ITEMS, PALETTE)).toBe('#111111');
    expect(resolveStableItemColor(ITEMS[1]!, ITEMS, PALETTE)).toBe('#222222');
  });

  it('prefers explicit series color', () => {
    expect(resolveStableItemColor(ITEMS[2]!, ITEMS, PALETTE)).toBe('#ff0000');
  });

  it('builds a stable id map', () => {
    const map = resolveStableColorMap(ITEMS, PALETTE);
    expect(map.get('a')).toBe('#111111');
    expect(map.get('b')).toBe('#222222');
    expect(map.get('c')).toBe('#ff0000');
  });
});
