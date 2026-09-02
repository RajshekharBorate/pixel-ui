import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import PixelDataGridComponent from './pixel-data-grid';
import type { PixelDataGridColumn } from './pixel-data-grid.types';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

interface Row {
  id: number;
  name: string;
}

@Component({
  imports: [PixelDataGridComponent],
  template: `
    <pixel-data-grid
      #grid
      analyticsId="claims"
      [data]="rows"
      [columns]="columns"
      exportable
      exportFileName="claims"
    />
  `,
})
class GridAnalyticsHost {
  readonly grid = viewChild.required<PixelDataGridComponent<Row>>('grid');
  readonly rows: Row[] = [
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
  ];
  readonly columns: PixelDataGridColumn<Row>[] = [
    { field: 'id', header: 'ID' },
    { field: 'name', header: 'Name' },
  ];
}

describe('pixel-data-grid analytics', () => {
  let port: PixelUiAnalyticsPort;

  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    port = { track: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: PIXEL_UI_ANALYTICS, useValue: port }],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it(
    'emits data.export with outcome on programmatic export',
    () => {
      const fixture = TestBed.createComponent(GridAnalyticsHost);
      fixture.detectChanges();
      fixture.componentInstance.grid().exportData('csv', 'all', 'api');
      expect(port.track).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'data.export',
          properties: expect.objectContaining({
            gridId: 'claims',
            format: 'csv',
            scope: 'all',
            source: 'api',
            outcome: 'success',
            rowCount: 2,
            columnCount: 2,
            hasActiveFilters: false,
          }),
        }),
      );
    },
    30_000,
  );
});
