import { Injectable, inject } from '@angular/core';
import { PIXEL_EXPORT_CONFIG } from './export.tokens';
import {
  PIXEL_EXPORT_DEFAULTS,
  type PixelExportColumn,
  type PixelExportConfig,
  type PixelExportFormat,
  type PixelExportTableOptions,
  type PixelSerializeOptions,
  type ResolvedPixelExportConfig,
} from './export.types';
import {
  copyTextToClipboard,
  exportTable as exportTableFn,
  saveAs as saveAsFn,
  serializeTable,
} from './export';
import { serializeToCsv, serializeToJson, serializeToSpreadsheetXml, serializeToTsv } from './serialize';
import { buildXlsxBlob } from './xlsx';

/**
 * Injectable facade over shared tabular export helpers (serialize + saveAs + clipboard).
 *
 * This is **not** a network download queue — use {@link PixelDownloadService} /
 * {@link PixelFileTransferService} for URL/backend file transfers.
 *
 * @example
 * ```ts
 * private readonly exporter = inject(PixelExportService);
 * this.exporter.exportTable(rows, columns, 'csv', { fileName: 'policies' });
 * this.exporter.exportTable(rows, columns, 'excel', { fileName: 'policies' }); // .xlsx
 * ```
 */
@Injectable({ providedIn: 'root' })
export class PixelExportService {
  private readonly cfgInput = inject(PIXEL_EXPORT_CONFIG, { optional: true });

  /** Resolved defaults (token merge over library defaults). */
  readonly config: ResolvedPixelExportConfig = {
    ...PIXEL_EXPORT_DEFAULTS,
    ...(this.cfgInput ?? {}),
  };

  /**
   * Serialize a text format (`csv` | `tsv` | `json`) without downloading.
   * For Excel use {@link buildExcelBlob}.
   */
  serialize(
    rows: readonly unknown[],
    columns: readonly PixelExportColumn[],
    format: Exclude<PixelExportFormat, 'excel'>,
    options?: PixelSerializeOptions,
  ): string {
    return serializeTable(rows, columns, format, this.mergeSerialize(options));
  }

  serializeCsv(
    rows: readonly unknown[],
    columns: readonly PixelExportColumn[],
    options?: PixelSerializeOptions,
  ): string {
    return serializeToCsv(rows, columns, this.mergeSerialize(options));
  }

  serializeTsv(
    rows: readonly unknown[],
    columns: readonly PixelExportColumn[],
    options?: PixelSerializeOptions,
  ): string {
    return serializeToTsv(rows, columns, this.mergeSerialize(options));
  }

  serializeJson(
    rows: readonly unknown[],
    columns: readonly PixelExportColumn[],
    options?: PixelSerializeOptions,
  ): string {
    return serializeToJson(rows, columns, this.mergeSerialize(options));
  }

  /** Builds a real `.xlsx` workbook Blob (OOXML, no SheetJS). */
  buildExcelBlob(
    rows: readonly unknown[],
    columns: readonly PixelExportColumn[],
    options?: PixelSerializeOptions,
  ): Blob {
    return buildXlsxBlob(rows, columns, this.mergeSerialize(options));
  }

  /**
   * Legacy SpreadsheetML string (`.xls`-era XML). Prefer {@link buildExcelBlob}.
   * @deprecated Use `buildExcelBlob` for `.xlsx` downloads.
   */
  serializeExcel(
    rows: readonly unknown[],
    columns: readonly PixelExportColumn[],
    options?: PixelSerializeOptions,
  ): string {
    return serializeToSpreadsheetXml(rows, columns, this.mergeSerialize(options));
  }

  /** Serialize and trigger a browser download (`excel` → `.xlsx`). */
  exportTable(
    rows: readonly unknown[],
    columns: readonly PixelExportColumn[],
    format: PixelExportFormat,
    options?: PixelExportTableOptions,
  ): void {
    exportTableFn(rows, columns, format, options ?? {}, this.config);
  }

  /** Save a Blob or string via the browser download affordance. */
  saveAs(data: Blob | string, fileName: string, mime?: string): void {
    saveAsFn(data, fileName, mime);
  }

  /** Copy text to the clipboard. */
  copyText(text: string): Promise<void> {
    return copyTextToClipboard(text);
  }

  /** Override defaults for a one-off call without replacing the token. */
  withConfig(partial: PixelExportConfig): ResolvedPixelExportConfig {
    return { ...this.config, ...partial };
  }

  private mergeSerialize(options?: PixelSerializeOptions): PixelSerializeOptions {
    return {
      prettyJson: options?.prettyJson ?? this.config.prettyJson,
      csvBom: options?.csvBom ?? this.config.csvBom,
      sheetName: options?.sheetName ?? this.config.sheetName,
    };
  }
}
