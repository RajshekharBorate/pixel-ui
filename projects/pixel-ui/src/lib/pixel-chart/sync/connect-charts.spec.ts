import { connectPixelCharts } from './connect-charts';

describe('connectPixelCharts', () => {
  it('ignores null charts and still returns a disconnect handle', () => {
    const handle = connectPixelCharts([null, undefined]);
    expect(handle.groupId).toMatch(/^pixel-chart-sync-/);
    expect(() => handle.disconnect()).not.toThrow();
  });
});
