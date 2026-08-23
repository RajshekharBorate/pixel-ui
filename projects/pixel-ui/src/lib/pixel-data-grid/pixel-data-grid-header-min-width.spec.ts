import { describe, expect, it } from 'vitest';
import type { PixelDataGridColumn } from './pixel-data-grid.types';
import {
  effectiveColumnMinWidthPx,
  estimateHeaderMinWidthPx,
  type PixelDataGridHeaderMinWidthContext,
} from './pixel-data-grid-header-min-width';

const BASE_CONTEXT: PixelDataGridHeaderMinWidthContext = {
  headerLabel: 'Name',
  density: 'standard',
  sortable: false,
  sortPriority: 0,
  showSortPriority: false,
  pinned: null,
  hasFilter: false,
  reorderable: false,
  showColumnMenu: false,
};

describe('pixel-data-grid header min width', () => {
  it('effectiveColumnMinWidthPx uses header estimate by default', () => {
    const column: PixelDataGridColumn = { field: 'name', header: 'Name' };
    expect(effectiveColumnMinWidthPx(column, 120)).toBe(120);
    expect(effectiveColumnMinWidthPx(column, 40)).toBe(120);
  });

  it('effectiveColumnMinWidthPx follows explicit column.minWidth', () => {
    const column: PixelDataGridColumn = { field: 'name', header: 'Very Long Header', minWidth: 40 };
    expect(effectiveColumnMinWidthPx(column, 200)).toBe(40);
  });

  it('effectiveColumnMinWidthPx honors an explicit default floor', () => {
    const column: PixelDataGridColumn = { field: 'id', header: 'ID' };
    expect(effectiveColumnMinWidthPx(column, 40, 112)).toBe(112);
    expect(effectiveColumnMinWidthPx(column, 40, 56)).toBe(56);
  });

  it('estimateHeaderMinWidthPx includes label padding and sort chrome', () => {
    const labelOnly = estimateHeaderMinWidthPx({ field: 'a', header: 'A' }, BASE_CONTEXT);
    const sortable = estimateHeaderMinWidthPx({ field: 'a', header: 'A' }, {
      ...BASE_CONTEXT,
      sortable: true,
    });
    expect(sortable).toBeGreaterThan(labelOnly);
  });

  it('estimateHeaderMinWidthPx is density-aware', () => {
    const standard = estimateHeaderMinWidthPx({ field: 'a', header: 'A' }, BASE_CONTEXT);
    const compact = estimateHeaderMinWidthPx({ field: 'a', header: 'A' }, {
      ...BASE_CONTEXT,
      density: 'compact',
    });
    expect(compact).toBeLessThan(standard);
  });

  it('estimateHeaderMinWidthPx accounts for filter and column menu buttons', () => {
    const withFilter = estimateHeaderMinWidthPx(
      { field: 'a', header: 'Team', filter: { type: 'text' } },
      { ...BASE_CONTEXT, hasFilter: true },
    );
    const withMenu = estimateHeaderMinWidthPx({ field: 'a', header: 'Team' }, {
      ...BASE_CONTEXT,
      showColumnMenu: true,
    });
    expect(withFilter).toBeGreaterThan(estimateHeaderMinWidthPx({ field: 'a', header: 'Team' }, BASE_CONTEXT));
    expect(withMenu).toBeGreaterThan(estimateHeaderMinWidthPx({ field: 'a', header: 'Team' }, BASE_CONTEXT));
  });
});
