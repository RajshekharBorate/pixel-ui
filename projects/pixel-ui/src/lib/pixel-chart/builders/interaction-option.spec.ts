import {
  resolveDataZoomMode,
  resolveZoomSelectionEnabled,
  withDataZoom,
  PIXEL_CHART_ZOOM_CATEGORY_THRESHOLD,
  PIXEL_CHART_ZOOM_POINT_THRESHOLD,
} from './interaction-option';

describe('withDataZoom', () => {
  const base = { series: [] };

  it('returns the same option when zoom is off', () => {
    expect(withDataZoom(base)).toBe(base);
    expect(withDataZoom(base, false)).toBe(base);
  });

  it('adds inside zoom when dataZoom is true', () => {
    const opt = withDataZoom({ series: [] }, true);
    const zooms = opt['dataZoom'] as { type: string }[];
    expect(zooms.some((z) => z.type === 'inside')).toBe(true);
    expect(opt['toolbox']).toBeUndefined();
  });

  it('adds slider and expands grid bottom', () => {
    const opt = withDataZoom({ grid: { bottom: 40 }, series: [] }, 'slider');
    const zooms = opt['dataZoom'] as { type: string }[];
    expect(zooms.some((z) => z.type === 'slider')).toBe(true);
    expect((opt['grid'] as { bottom: number }).bottom).toBeGreaterThanOrEqual(56);
  });

  it('selection adds slider, inside, and hidden toolbox dataZoom', () => {
    const opt = withDataZoom({ grid: { bottom: 40 }, series: [] }, 'selection');
    const zooms = opt['dataZoom'] as { type: string }[];
    expect(zooms.map((z) => z.type).sort()).toEqual(['inside', 'slider']);
    const toolbox = opt['toolbox'] as { show: boolean; feature: { dataZoom: unknown } };
    expect(toolbox.show).toBe(false);
    expect(toolbox.feature.dataZoom).toBeTruthy();
  });
});

describe('resolveZoomSelectionEnabled', () => {
  it('honors explicit true/false', () => {
    expect(resolveZoomSelectionEnabled(true, [], [])).toBe(true);
    expect(resolveZoomSelectionEnabled(false, Array(40).fill('x'), [])).toBe(false);
  });

  it('auto uses category threshold', () => {
    expect(
      resolveZoomSelectionEnabled('auto', Array(24).fill('x'), [], PIXEL_CHART_ZOOM_CATEGORY_THRESHOLD),
    ).toBe(true);
    expect(
      resolveZoomSelectionEnabled('auto', Array(23).fill('x'), [], PIXEL_CHART_ZOOM_CATEGORY_THRESHOLD),
    ).toBe(false);
  });

  it('auto uses point threshold when categories are short', () => {
    const series = [{ id: 'a', name: 'A', data: Array(PIXEL_CHART_ZOOM_POINT_THRESHOLD).fill(1) }];
    expect(resolveZoomSelectionEnabled('auto', [], series)).toBe(true);
  });
});

describe('resolveDataZoomMode', () => {
  it('auto maps large data to selection', () => {
    expect(resolveDataZoomMode('auto', 24)).toBe('selection');
    expect(resolveDataZoomMode('auto', 10)).toBe(false);
  });

  it('passes through explicit modes', () => {
    expect(resolveDataZoomMode('slider', 10)).toBe('slider');
    expect(resolveDataZoomMode(false, 100)).toBe(false);
  });
});
