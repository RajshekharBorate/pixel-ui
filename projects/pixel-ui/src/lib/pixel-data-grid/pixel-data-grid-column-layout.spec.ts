import { describe, expect, it } from 'vitest';
import type { PixelDataGridColumn } from './pixel-data-grid.types';
import { resolveViewportColumnWidths } from './pixel-data-grid-column-layout';

const EMPTY_HEADER_MINS: Record<string, number> = {};

describe('resolveViewportColumnWidths', () => {
  it('distributes remaining space to flex columns by grow ratio', () => {
    const columns: PixelDataGridColumn[] = [
      { field: 'id', header: 'ID', width: '100px' },
      { field: 'name', header: 'Name', flex: 2, minWidth: 80 },
      { field: 'team', header: 'Team', flex: 1, minWidth: 80 },
    ];

    const widths = resolveViewportColumnWidths({
      columns,
      viewportWidthPx: 700,
      leadingWidthPx: 0,
      userWidths: {},
      headerMinWidths: EMPTY_HEADER_MINS,
    });

    expect(widths['id']).toBe(100);
    expect(widths['name']).toBe(400);
    expect(widths['team']).toBe(200);
  });

  it('respects user-resized widths and maxWidth caps', () => {
    const columns: PixelDataGridColumn[] = [
      { field: 'name', header: 'Name', flex: 1, maxWidth: 180 },
      { field: 'team', header: 'Team', flex: 1 },
    ];

    const widths = resolveViewportColumnWidths({
      columns,
      viewportWidthPx: 800,
      leadingWidthPx: 44,
      userWidths: { name: 260 },
      headerMinWidths: EMPTY_HEADER_MINS,
    });

    expect(widths['name']).toBe(180);
    expect(widths['team']).toBe(756 - 180);
  });

  it('treats unsized columns as flex: 1', () => {
    const columns: PixelDataGridColumn[] = [
      { field: 'a', header: 'A' },
      { field: 'b', header: 'B' },
    ];

    const widths = resolveViewportColumnWidths({
      columns,
      viewportWidthPx: 400,
      leadingWidthPx: 0,
      userWidths: {},
      headerMinWidths: EMPTY_HEADER_MINS,
    });

    expect(widths['a']).toBe(200);
    expect(widths['b']).toBe(200);
  });

  it('respects header minimum widths in flex distribution', () => {
    const columns: PixelDataGridColumn[] = [
      { field: 'name', header: 'Name', flex: 1 },
      { field: 'team', header: 'Team', flex: 1 },
    ];

    const widths = resolveViewportColumnWidths({
      columns,
      viewportWidthPx: 400,
      leadingWidthPx: 0,
      userWidths: {},
      headerMinWidths: { name: 180, team: 120 },
    });

    expect(widths['name']).toBeGreaterThanOrEqual(180);
    expect(widths['team']).toBeGreaterThanOrEqual(120);
    expect(widths['name'] + widths['team']).toBe(400);
  });

  it('allows shrinking a user-resized column below its previous width', () => {
    const columns: PixelDataGridColumn[] = [
      { field: 'name', header: 'Name', flex: 1 },
      { field: 'team', header: 'Team', flex: 1 },
    ];
    const headerMinWidths = { name: 80, team: 80 };

    const wide = resolveViewportColumnWidths({
      columns,
      viewportWidthPx: 400,
      leadingWidthPx: 0,
      userWidths: { name: 280 },
      headerMinWidths,
    });
    const narrow = resolveViewportColumnWidths({
      columns,
      viewportWidthPx: 400,
      leadingWidthPx: 0,
      userWidths: { name: 120 },
      headerMinWidths,
    });

    expect(wide['name']).toBe(280);
    expect(narrow['name']).toBe(120);
    expect(narrow['name']).toBeLessThan(wide['name']);
  });

  it('ignores width when flex is set', () => {
    const columns: PixelDataGridColumn[] = [{ field: 'name', header: 'Name', width: '20rem', flex: 1 }];

    const widths = resolveViewportColumnWidths({
      columns,
      viewportWidthPx: 320,
      leadingWidthPx: 0,
      userWidths: {},
      headerMinWidths: EMPTY_HEADER_MINS,
    });

    expect(widths['name']).toBe(320);
  });
});
