import type { PixelExportColumn, PixelSerializeOptions } from './export.types';
import { PIXEL_EXPORT_DEFAULTS } from './export.types';
import { parseLocalIsoDate, toLocalIsoDate } from '../../shared/datetime/pixel-date-utils';

/** Resolves the header label for a column. */
export function exportColumnHeader(column: PixelExportColumn): string {
  return column.header?.trim() ? column.header : column.key;
}

/**
 * Formats a date for CSV/Excel as `YYYY-MM-DD` (no time). Full ISO timestamps make Excel
 * auto-detect odd date/times and often show `######` until the column is widened.
 *
 * Uses `parseLocalIsoDate` so exact `YYYY-MM-DD` strings stay as the local civil day
 * (no UTC-midnight shift west of UTC), and full ISO strings resolve to the viewer's local
 * civil day (not a naïve 10-char slice, which would show the UTC date instead).
 */
export function formatExportDate(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const date = parseLocalIsoDate(value as string | Date | number);
  if (!date) {
    return String(value);
  }
  return toLocalIsoDate(date);
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
