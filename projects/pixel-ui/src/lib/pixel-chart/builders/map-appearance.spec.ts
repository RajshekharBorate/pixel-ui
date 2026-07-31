import {
  PIXEL_CHART_MAP_APPEARANCE_DEFAULT,
  PIXEL_CHART_MAP_WORLD_GEO_VIEW,
  resolveMapChrome,
} from './map-appearance';

describe('map appearance helpers', () => {
  it('defaults to soft chrome', () => {
    expect(PIXEL_CHART_MAP_APPEARANCE_DEFAULT).toBe('soft');
    expect(resolveMapChrome(undefined).borderWidth).toBe(resolveMapChrome('soft').borderWidth);
  });

  it('scales elevation from minimal → soft → emphasis', () => {
    const minimal = resolveMapChrome('minimal');
    const soft = resolveMapChrome('soft');
    const emphasis = resolveMapChrome('emphasis');
    expect(minimal.borderWidth).toBeLessThan(soft.borderWidth);
    expect(soft.borderWidth).toBeLessThan(emphasis.borderWidth);
    expect(minimal.shadowBlur).toBeLessThan(emphasis.shadowBlur);
  });

  it('exposes a world framing helper', () => {
    expect(PIXEL_CHART_MAP_WORLD_GEO_VIEW.boundingCoords).toHaveLength(2);
  });
});
