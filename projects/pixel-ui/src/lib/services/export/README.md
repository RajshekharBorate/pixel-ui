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
├── buildExcelBlob          ← real OOXML .xlsx (DEFLATE when available, date serials)
├── saveAs                  ← shared with File Transfer's saveBlob
└── copyText

Pure functions (also public)
├── serializeToCsv / Tsv / Json
├── buildXlsxBlob / toExcelDateSerial
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
        csvBom: true,
        sheetName: 'Data',
      },
    },
  ],
};
```

`PixelExportService` is `providedIn: 'root'` — no provider required for basic use.

## Usage

```ts
private readonly exporter = inject(PixelExportService);

exportCsv(): void {
  this.exporter.exportTable(this.rows, this.columns, 'csv', { fileName: 'policies' });
}

async exportExcel(): Promise<void> {
  this.exporter.exportTable(this.rows, this.columns, 'excel', { fileName: 'policies' });
  // or: const blob = await this.exporter.buildExcelBlob(this.rows, this.columns);
}
```

## Formats

| Format | Output | Notes |
| --- | --- | --- |
| `csv` | `.csv` | RFC quoting; UTF-8 BOM by default; date columns as Excel text formulas |
| `tsv` | `.tsv` | Tab delimiter (clipboard from the grid) |
| `json` | `.json` | Array of objects keyed by header |
| `excel` | `.xlsx` | OOXML workbook; DEFLATE ZIP when `CompressionStream` exists; date serials + `yyyy-mm-dd` + column widths |

Dates (`Date` or ISO-like strings):

- **CSV** — `YYYY-MM-DD` written as Excel text (`="2024-03-05"`) when `type: 'date'`
- **Excel** — true date serials formatted as `yyyy-mm-dd`, with explicit column widths so Excel does not show `######`

## Relationship to the data grid

`pixel-data-grid` with `exportable` uses these helpers for its toolbar export menu.

## Relationship to File Transfer

| Concern | Export | File Transfer |
| --- | --- | --- |
| Rows → CSV/JSON/Excel | ✅ | ❌ |
| Local save (`saveAs`) | ✅ | uses shared `saveAs` via `saveBlob` |
| HTTP download queue | ❌ | ✅ |

## Breaking changes

- `excel` downloads are **`.xlsx`** (not SpreadsheetML `.xls`).
- `serializeToSpreadsheetXml` / `serializeExcel` / `gridRowsToSpreadsheetXml` **removed**.
- `buildXlsxBlob` / `buildExcelBlob` are **async** (`Promise<Blob>`).
- `serialize()` / `serializeTable()` do not accept `'excel'`.
