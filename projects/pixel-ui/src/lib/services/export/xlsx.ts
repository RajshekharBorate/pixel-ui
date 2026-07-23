import { PIXEL_EXPORT_DEFAULTS, type PixelExportColumn, type PixelSerializeOptions } from './export.types';
import { exportCellValue, exportColumnHeader } from './serialize';
import { buildStoredZip } from './zip';

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

function colName(index: number): string {
  // 0-based → A, B, … Z, AA, …
  let n = index;
  let label = '';
  do {
    label = String.fromCharCode((n % 26) + 65) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

function cellXml(ref: string, value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  const text = xmlEscape(value);
  return `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`;
}

function buildSheetXml(
  rows: readonly unknown[],
  columns: readonly PixelExportColumn[],
): string {
  const rowCount = rows.length + 1; // + header
  const colCount = Math.max(1, columns.length);
  const lastRef = `${colName(colCount - 1)}${rowCount}`;
  const sheetRows: string[] = [];

  const headerCells = columns
    .map((column, index) => cellXml(`${colName(index)}1`, exportColumnHeader(column)))
    .join('');
  sheetRows.push(`<row r="1">${headerCells}</row>`);

  rows.forEach((row, rowIndex) => {
    const r = rowIndex + 2;
    const cells = columns
      .map((column, index) => cellXml(`${colName(index)}${r}`, exportCellValue(row, column)))
      .join('');
    sheetRows.push(`<row r="${r}">${cells}</row>`);
  });

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<dimension ref="A1:${lastRef}"/>` +
    `<sheetData>${sheetRows.join('')}</sheetData>` +
    '</worksheet>'
  );
}

/**
 * Builds a real Office Open XML workbook (`.xlsx`) as a Blob — no SheetJS.
 * Uses a stored (uncompressed) ZIP package Excel accepts without extension warnings.
 */
export function buildXlsxBlob(
  rows: readonly unknown[],
  columns: readonly PixelExportColumn[],
  options: PixelSerializeOptions = {},
): Blob {
  const sheetName = sanitizeExcelSheetName(options.sheetName ?? PIXEL_EXPORT_DEFAULTS.sheetName);
  const sheetXml = buildSheetXml(rows, columns);

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
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
    '</Relationships>';

  return buildStoredZip({
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rootRels,
    'xl/workbook.xml': workbook,
    'xl/_rels/workbook.xml.rels': workbookRels,
    'xl/worksheets/sheet1.xml': sheetXml,
  });
}
