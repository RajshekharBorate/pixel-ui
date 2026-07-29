import { withDataZoom } from './interaction-option';

describe('withDataZoom', () => {
  const base = { series: [] };

  it('returns the same option when zoom is off', () => {
    expect(withDataZoom(base)).toBe(base);
    expect(withDataZoom(base, false)).toBe(base);
  });

  it('does not add brush or toolbox', () => {
    const opt = withDataZoom({ series: [] }, true);
    expect(opt['brush']).toBeUndefined();
    expect(opt['toolbox']).toBeUndefined();
  });

  it('adds inside zoom when dataZoom is true', () => {
    const opt = withDataZoom({ series: [] }, true);
    const zooms = opt['dataZoom'] as { type: string }[];
    expect(zooms.some((z) => z.type === 'inside')).toBe(true);
  });

  it('adds slider and expands grid bottom', () => {
    const opt = withDataZoom({ grid: { bottom: 40 }, series: [] }, 'slider');
    const zooms = opt['dataZoom'] as { type: string }[];
    expect(zooms.some((z) => z.type === 'slider')).toBe(true);
    expect((opt['grid'] as { bottom: number }).bottom).toBeGreaterThanOrEqual(48);
  });

  it('adds both inside and slider for both mode', () => {
    const opt = withDataZoom({ grid: { bottom: 40 }, series: [] }, 'both');
    const zooms = opt['dataZoom'] as { type: string }[];
    expect(zooms.map((z) => z.type).sort()).toEqual(['inside', 'slider']);
  });
});
