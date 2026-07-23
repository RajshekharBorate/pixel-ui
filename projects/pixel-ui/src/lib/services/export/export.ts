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
import {
  serializeToCsv,
  serializeToJson,
  serializeToSpreadsheetXml,
  serializeToTsv,
} from './serialize';

/** Serialize rows for a given format. */
export function serializeTable(
  rows: readonly unknown[],
  columns: readonly PixelExportColumn[],
  format: PixelExportFormat,
  options: PixelSerializeOptions = {},
): string {
  switch (format) {
    case 'tsv':
      return serializeToTsv(rows, columns, options);
    case 'json':
      return serializeToJson(rows, columns, options);
    case 'excel':
      return serializeToSpreadsheetXml(rows, columns, options);
    default:
      return serializeToCsv(rows, columns, options);
  }
}

/**
 * Serialize tabular data and trigger a browser download.
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
  const content = serializeTable(rows, columns, format, merged);
  const base = options.fileName?.trim() || config.defaultFileName;
  const fileName = `${base}.${PIXEL_EXPORT_EXTENSION[format]}`;
  saveAs(content, fileName, PIXEL_EXPORT_MIME[format]);
}

export { copyTextToClipboard, saveAs };
