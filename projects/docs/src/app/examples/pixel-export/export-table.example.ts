import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelExportService,
  type PixelExportColumn,
} from 'pixel-ui';

interface PolicyRow {
  id: number;
  name: string;
  amount: number;
}

@Component({
  selector: 'docs-export-table-example',
  imports: [PixelButtonComponent],
  template: `
    <p class="hint">
      PixelExportService serializes in-memory rows and triggers a local download (or clipboard).
      No network queue — that is File Transfer.
    </p>
    <div class="grid">
      <pixel-button appearance="outline" leadingIcon="description" (click)="exportCsv()">
        Export CSV
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="data_object" (click)="exportJson()">
        Export JSON
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="table" (click)="exportExcel()">
        Export Excel
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="content_copy" (click)="copyTsv()">
        Copy TSV
      </pixel-button>
    </div>
    @if (status()) {
      <p class="info">{{ status() }}</p>
    }
  `,
  styles: `
    .hint {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      color: var(--pixel-sys-outline);
    }
    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .info {
      margin-block-start: 0.75rem;
      font-size: 0.875rem;
      color: var(--pixel-sys-outline);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportTableExample {
  private readonly exporter = inject(PixelExportService);
  protected readonly status = signal('');

  private readonly rows: PolicyRow[] = [
    { id: 1, name: 'Policy A', amount: 1200 },
    { id: 2, name: 'Policy B', amount: 980 },
    { id: 3, name: 'Policy C', amount: 1500 },
  ];

  private readonly columns: PixelExportColumn[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'amount', header: 'Amount' },
  ];

  protected exportCsv(): void {
    this.exporter.exportTable(this.rows, this.columns, 'csv', { fileName: 'policies' });
    this.status.set('Downloaded policies.csv');
  }

  protected exportJson(): void {
    this.exporter.exportTable(this.rows, this.columns, 'json', { fileName: 'policies' });
    this.status.set('Downloaded policies.json');
  }

  protected exportExcel(): void {
    this.exporter.exportTable(this.rows, this.columns, 'excel', {
      fileName: 'policies',
      sheetName: 'Policies',
    });
    this.status.set('Downloaded policies.xls');
  }

  protected async copyTsv(): Promise<void> {
    const tsv = this.exporter.serializeTsv(this.rows, this.columns);
    await this.exporter.copyText(tsv);
    this.status.set('Copied TSV to clipboard');
  }
}
