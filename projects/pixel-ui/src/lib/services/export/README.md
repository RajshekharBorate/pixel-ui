# Pixel Export

UI-independent **serialize + saveAs** helpers for tabular data (CSV / TSV / JSON /
real **`.xlsx`**), plus an injectable `PixelExportService` facade.

This is **not** a network download engine. For URL/backend transfers with queues,
progress, retry, and ZIP, use **File Transfer** (`PixelFileTransferService` /
`PixelDownloadService`). Export builds a file in memory; File Transfer moves files
over the network.

## Architecture

```
PixelExportService          ← injectable facade (defaults via PIXEL_EXPORT_CONFIG)
├── serialize* / exportTable
├── buildExcelBlob          ← real OOXML .xlsx (stored ZIP, no SheetJS)
├── saveAs                  ← shared with File Transfer's saveBlob
└── copyText

Pure functions (also public)
├── serializeToCsv / Tsv / Json
├── buildXlsxBlob
├── serializeTable / exportTable
├── saveAs
└── copyTextToClipboard
```

## Setup (optional defaults)

```ts
import { PIXEL_EXPORT_CONFIG } from 'pixel-ui';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: PIXEL_EXPORT_CONFIG,
      useValue: {
        defaultFileName: 'report',
        prettyJson: true,
        csvBom: true,       // help Excel detect UTF-8
        sheetName: 'Data',
      },
    },
  ],
};
```

`PixelExportService` is `providedIn: 'root'` — no provider required for basic use.

## Usage

```ts
import { inject } from '@angular/core';
import { PixelExportService, type PixelExportColumn } from 'pixel-ui';

private readonly exporter = inject(PixelExportService);

readonly columns: PixelExportColumn[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'amount', header: 'Amount' },
];

exportCsv(): void {
  this.exporter.exportTable(this.rows, this.columns, 'csv', { fileName: 'policies' });
}

exportExcel(): void {
  // Downloads policies.xlsx — opens in Excel without the format/extension warning.
  this.exporter.exportTable(this.rows, this.columns, 'excel', { fileName: 'policies' });
}

copyTsv(): void {
  const tsv = this.exporter.serializeTsv(this.rows, this.columns);
  void this.exporter.copyText(tsv);
}
```

Functions work without DI:

```ts
import { exportTable, buildXlsxBlob, saveAs } from 'pixel-ui';

exportTable(rows, columns, 'excel', { fileName: 'sheet' });
saveAs(buildXlsxBlob(rows, columns), 'data.xlsx');
```

## Formats

| Format | Output | Notes |
| --- | --- | --- |
| `csv` | `.csv` | RFC-style quoting; optional UTF-8 BOM |
| `tsv` | `.tsv` | Tab delimiter (also used for clipboard from the grid) |
| `json` | `.json` | Array of objects keyed by header |
| `excel` | `.xlsx` | Real OOXML workbook (stored ZIP package, no SheetJS) |

Legacy `serializeToSpreadsheetXml` (SpreadsheetML string) remains for compatibility but is
**deprecated** — prefer `buildXlsxBlob` / `exportTable(..., 'excel')`.

Dates (`Date` or ISO-like strings) serialize as **`YYYY-MM-DD`**. For CSV, date columns marked
`type: 'date'` are written as Excel text formulas (`="2024-03-05"`) so Excel does not turn them
into date serials that display as `######`.
## Relationship to the data grid

`pixel-data-grid` with `exportable` uses these helpers under the hood for its toolbar
export menu. Grid-specific concerns (visible columns, selected/page/all scope,
DataSource fetch-all) stay on the grid; serialization and download live here.

## Relationship to File Transfer

| Concern | Export | File Transfer |
| --- | --- | --- |
| Rows → CSV/JSON/Excel | ✅ | ❌ |
| Local save (`saveAs`) | ✅ | uses shared `saveAs` via `saveBlob` |
| HTTP download queue | ❌ | ✅ |
| Progress / retry / zip | ❌ | ✅ |

## Breaking changes

- `excel` downloads are **`.xlsx`** (not SpreadsheetML `.xls`). MIME is the Open XML
  spreadsheet type. This removes Excel’s “format and extension don’t match” warning.
- `serialize()` / `serializeTable()` no longer accept `'excel'` (binary). Use
  `buildExcelBlob` / `buildXlsxBlob` instead.
