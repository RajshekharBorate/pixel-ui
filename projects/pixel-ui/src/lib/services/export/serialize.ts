import type { PixelExportColumn, PixelSerializeOptions } from './export.types';
import { PIXEL_EXPORT_DEFAULTS } from './export.types';

/** Resolves the header label for a column. */
export function exportColumnHeader(column: PixelExportColumn): string {
  return column.header?.trim() ? column.header : column.key;
}

/**
 * Formats a date for CSV/Excel as `YYYY-MM-DD` (no time). Full ISO timestamps make Excel
 * auto-detect odd date/times and often show `######` until the column is widened.
 */
export function formatExportDate(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
  }
  const date = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Resolves a cell value (Date → `YYYY-MM-DD`, nullish → ''). */
export function exportCellValue(row: unknown, column: PixelExportColumn): unknown {
  const raw =
    column.value?.(row) ??
    (row && typeof row === 'object'
      ? (row as Record<string, unknown>)[column.key]
      : undefined);
  if (raw instanceof Date) {
    return formatExportDate(raw);
  }
  return raw ?? '';
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * CSV cell Excel displays as literal text (not an auto-parsed date serial).
 * Written as `"=""2024-03-05"""` so Excel shows `2024-03-05` instead of `######`.
 */
export function excelLiteralTextCsvCell(text: string): string {
  if (!text) {
    return '';
  }
  const escaped = text.replace(/"/g, '""');
  return `"=""${escaped}"""`;
}

function tsvEscape(value: unknown): string {
  return String(value ?? '').replace(/[\t\n\r]/g, ' ');
}

/** Builds a delimited (CSV/TSV) document from rows + columns. */
export function serializeToDelimited(
  rows: readonly unknown[],
  columns: readonly PixelExportColumn[],
  delimiter = ',',
  options: PixelSerializeOptions = {},
): string {
  const escape = delimiter === '\t' ? tsvEscape : csvEscape;
  const header = columns.map((column) => escape(exportColumnHeader(column))).join(delimiter);
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const value = exportCellValue(row, column);
          // Force Excel to keep dates as visible text when opening CSV (not ######).
          if (delimiter === ',' && column.type === 'date') {
            const dateText = formatExportDate(value);
            return dateText ? excelLiteralTextCsvCell(dateText) : '';
          }
          return escape(value);
        })
        .join(delimiter),
    )
    .join('\n');
  const document = body ? `${header}\n${body}` : header;
  if (delimiter === ',' && (options.csvBom ?? PIXEL_EXPORT_DEFAULTS.csvBom)) {
    return `\uFEFF${document}`;
  }
  return document;
}

/** CSV convenience wrapper. */
export function serializeToCsv(
  rows: readonly unknown[],
  columns: readonly PixelExportColumn[],
  options?: PixelSerializeOptions,
): string {
  return serializeToDelimited(rows, columns, ',', options);
}

/** TSV convenience wrapper. */
export function serializeToTsv(
  rows: readonly unknown[],
  columns: readonly PixelExportColumn[],
  options?: PixelSerializeOptions,
): string {
  return serializeToDelimited(rows, columns, '\t', options);
}

/** Builds a JSON array keyed by header labels. */
export function serializeToJson(
  rows: readonly unknown[],
  columns: readonly PixelExportColumn[],
  options: PixelSerializeOptions = {},
): string {
  const pretty = options.prettyJson ?? PIXEL_EXPORT_DEFAULTS.prettyJson;
  const payload = rows.map((row) => {
    const record: Record<string, unknown> = {};
    for (const column of columns) {
      record[exportColumnHeader(column)] = exportCellValue(row, column);
    }
    return record;
  });
  return JSON.stringify(payload, null, pretty ? 2 : undefined);
}
