import { resolvePixelChartDecal, withPatternFills } from './pattern-fills';

describe('pattern fills', () => {
  it('resolves named decals', () => {
    expect(resolvePixelChartDecal('none')).toBeUndefined();
    expect(resolvePixelChartDecal('dots')?.['symbol']).toBe('circle');
  });

  it('applies rotating decals to series', () => {
    const opt = withPatternFills(
      {
        series: [{ type: 'bar', itemStyle: { color: '#1565c0' } }, { type: 'bar' }],
      },
      true,
    );
    const series = opt['series'] as { itemStyle?: { decal?: unknown } }[];
    expect(series[0]?.itemStyle?.decal).toBeTruthy();
    expect(series[1]?.itemStyle?.decal).toBeTruthy();
    expect(withPatternFills({ series: [] }, false)['series']).toEqual([]);
  });
});
