import { PIXEL_EXPORT_DEFAULTS, type PixelExportColumn, type PixelSerializeOptions } from './export.types';
import { exportCellValue, exportColumnHeader, formatExportDate } from './serialize';
import { parseLocalIsoDate } from '../../shared/datetime/pixel-date-utils';
import { buildZip } from './zip';

function xmlEscape(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Excel sheet names: max 31 chars; cannot contain \ / ? * [ ]. */
export function sanitizeExcelSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]]/g, '_').trim() || PIXEL_EXPORT_DEFAULTS.sheetName;
  return cleaned.slice(0, 31);
}

/**
 * Converts a Date / `YYYY-MM-DD` / parseable value to an Excel date serial
 * (days since 1899-12-30, matching Excel's 1900 date system).
 *
 * Uses `parseLocalIsoDate` so exact `YYYY-MM-DD` strings are treated as local civil days
 * (no UTC-midnight day shift west of UTC). Once we have the local Y/M/D fields we compute
 * the serial with `Date.UTC` so the arithmetic is timezone-independent.
 */
export function toExcelDateSerial(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = parseLocalIsoDate(value as string | Date | number);
  if (!date) {
    return null;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const excelEpochUtc = Date.UTC(1899, 11, 30);
  const utc = Date.UTC(year, month - 1, day);
  return Math.round((utc - excelEpochUtc) / 86_400_000);
}

function colName(index: number): string {
  let n = index;
  let label = '';
  do {
    label = String.fromCharCode((n % 26) + 65) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

/** Style index 1 = custom `yyyy-mm-dd` (see styles.xml). */
const DATE_STYLE_INDEX = 1;

/** Excel default column width (~8.43) is too narrow for dates → `######` (looks like x’s). */
const DEFAULT_COL_WIDTH = 14;
const DATE_COL_WIDTH = 12;

function cellXml(ref: string, value: unknown, column: PixelExportColumn): string {
  if (column.type === 'date') {
    const serial = toExcelDateSerial(value);
    if (serial !== null) {
      return `<c r="${ref}" s="${DATE_STYLE_INDEX}"><v>${serial}</v></c>`;
    }
    const fallback = formatExportDate(value);
    if (fallback) {
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(fallback)}</t></is></c>`;
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }

  const text = xmlEscape(value);
  return `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`;
}

function columnWidth(column: PixelExportColumn): number {
  if (column.type === 'date') {
    return DATE_COL_WIDTH;
  }
  const headerLen = exportColumnHeader(column).length;
  return Math.min(40, Math.max(DEFAULT_COL_WIDTH, headerLen + 2));
}

function buildColsXml(columns: readonly PixelExportColumn[]): string {
  if (!columns.length) {
    return '';
  }
  const cols = columns
    .map(
      (column, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${columnWidth(column)}" customWidth="1"/>`,
    )
    .join('');
  return `<cols>${cols}</cols>`;
}

function buildSheetXml(
  rows: readonly unknown[],
  columns: readonly PixelExportColumn[],
): string {
  const rowCount = rows.length + 1;
  const colCount = Math.max(1, columns.length);
  const lastRef = `${colName(colCount - 1)}${rowCount}`;
  const sheetRows: string[] = [];

  const headerCells = columns
    .map((column, index) => cellXml(`${colName(index)}1`, exportColumnHeader(column), { key: column.key }))
    .join('');
  sheetRows.push(`<row r="1">${headerCells}</row>`);

  rows.forEach((row, rowIndex) => {
    const r = rowIndex + 2;
    const cells = columns
      .map((column, index) => cellXml(`${colName(index)}${r}`, exportCellValue(row, column), column))
      .join('');
    sheetRows.push(`<row r="${r}">${cells}</row>`);
  });

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<dimension ref="A1:${lastRef}"/>` +
    buildColsXml(columns) +
    `<sheetData>${sheetRows.join('')}</sheetData>` +
    '</worksheet>'
  );
}

function buildStylesXml(): string {
  // Custom 164 = yyyy-mm-dd (locale short-date #14 often overflows default column width → ######).
  // Excel expects at least two fills (none + gray125).
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts>' +
    '<fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font></fonts>' +
    '<fills count="2">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '</fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="2">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '</cellXfs>' +
    '</styleSheet>'
  );
}

/**
 * Builds a real Office Open XML workbook (`.xlsx`) as a Blob — no SheetJS.
 * Prefers DEFLATE ZIP entries when CompressionStream is available; otherwise stores.
 * Date columns use Excel date serials + `yyyy-mm-dd` format and explicit column widths
 * (avoids Excel’s `######` placeholder when the default column is too narrow).
 */
export async function buildXlsxBlob(
  rows: readonly unknown[],
  columns: readonly PixelExportColumn[],
  options: PixelSerializeOptions = {},
): Promise<Blob> {
  const sheetName = sanitizeExcelSheetName(options.sheetName ?? PIXEL_EXPORT_DEFAULTS.sheetName);
  const sheetXml = buildSheetXml(rows, columns);

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '</Types>';

  const rootRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets>' +
    `<sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/>` +
    '</sheets>' +
    '</workbook>';

  const workbookRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';

  return buildZip({
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rootRels,
    'xl/workbook.xml': workbook,
    'xl/_rels/workbook.xml.rels': workbookRels,
    'xl/worksheets/sheet1.xml': sheetXml,
    'xl/styles.xml': buildStylesXml(),
  });
}
