import { createDocExample } from '../../shared/example-source.util';
import { ExportTableExample } from './export-table.example';

export const EXPORT_EXAMPLES = [
  createDocExample({
    id: 'export-table',
    title: 'Serialize & download',
    category: 'Basics',
    description:
      'PixelExportService turns in-memory rows into CSV / JSON / Excel (.xlsx) or copies TSV to the clipboard. Local save only — use File Transfer for HTTP download queues.',
    component: ExportTableExample,
    imports: ['PixelExportService', 'PixelButtonComponent'],
    html: `<pixel-button (click)="exportCsv()">Export CSV</pixel-button>
<pixel-button (click)="exportJson()">Export JSON</pixel-button>
<pixel-button (click)="exportExcel()">Export Excel</pixel-button>
<pixel-button (click)="copyTsv()">Copy TSV</pixel-button>`,
    typescript: `import { Component, inject } from '@angular/core';
import { PixelExportService, type PixelExportColumn } from 'pixel-ui';

@Component({ /* … */ })
export class ExportTableExample {
  private readonly exporter = inject(PixelExportService);

  private readonly rows = [
    { id: 1, name: 'Policy A', amount: 1200 },
    { id: 2, name: 'Policy B', amount: 980 },
  ];
  private readonly columns: PixelExportColumn[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'amount', header: 'Amount' },
  ];

  exportCsv(): void {
    this.exporter.exportTable(this.rows, this.columns, 'csv', { fileName: 'policies' });
  }
}`,
  }),
];
