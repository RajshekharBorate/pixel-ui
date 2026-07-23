import {
  PIXEL_EXPORT_DEFAULTS,
  PIXEL_EXPORT_EXTENSION,
  PIXEL_EXPORT_MIME,
  type PixelExportColumn,
  type PixelExportFormat,
  type PixelExportTableOptions,
  type PixelSerializeOptions,
  type ResolvedPixelExportConfig,
} from './export.types';
import { copyTextToClipboard } from './clipboard';
import { saveAs } from './save-as';
import { serializeToCsv, serializeToJson, serializeToTsv } from './serialize';
import { buildXlsxBlob } from './xlsx';

/**
 * Serialize rows for a text format (`csv` | `tsv` | `json`).
 * For Excel use {@link buildXlsxBlob} — `.xlsx` is a binary ZIP package.
 */
export function serializeTable(
  rows: readonly unknown[],
  columns: readonly PixelExportColumn[],
  format: Exclude<PixelExportFormat, 'excel'>,
  options: PixelSerializeOptions = {},
): string {
  switch (format) {
    case 'tsv':
      return serializeToTsv(rows, columns, options);
    case 'json':
      return serializeToJson(rows, columns, options);
    default:
      return serializeToCsv(rows, columns, options);
  }
}

/**
 * Serialize tabular data and trigger a browser download.
 * `excel` produces a real `.xlsx` (OOXML) Blob — DEFLATE when available, date serials for date columns.
 * For clipboard/TSV copy without download, call {@link serializeToTsv} + {@link copyTextToClipboard}.
 */
export function exportTable(
  rows: readonly unknown[],
  columns: readonly PixelExportColumn[],
  format: PixelExportFormat,
  options: PixelExportTableOptions = {},
  config: ResolvedPixelExportConfig = PIXEL_EXPORT_DEFAULTS,
): void {
  const merged: PixelSerializeOptions = {
    prettyJson: options.prettyJson ?? config.prettyJson,
    csvBom: options.csvBom ?? config.csvBom,
    sheetName: options.sheetName ?? config.sheetName,
  };
  const base = options.fileName?.trim() || config.defaultFileName;
  const fileName = `${base}.${PIXEL_EXPORT_EXTENSION[format]}`;

  if (format === 'excel') {
    void buildXlsxBlob(rows, columns, merged).then((blob) => {
      saveAs(blob, fileName, PIXEL_EXPORT_MIME.excel);
    });
    return;
  }

  const content = serializeTable(rows, columns, format, merged);
  saveAs(content, fileName, PIXEL_EXPORT_MIME[format]);
}

export { copyTextToClipboard, saveAs, buildXlsxBlob };
