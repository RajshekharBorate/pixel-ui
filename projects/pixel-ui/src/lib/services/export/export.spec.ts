import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PixelExportService } from './export.service';
import { PIXEL_EXPORT_CONFIG } from './export.tokens';
import type { PixelExportColumn } from './export.types';
import { exportTable, serializeTable } from './export';
import { saveAs } from './save-as';
import {
  serializeToCsv,
  serializeToJson,
  serializeToTsv,
  formatExportDate,
  excelLiteralTextCsvCell,
} from './serialize';
import { buildXlsxBlob, sanitizeExcelSheetName, toExcelDateSerial } from './xlsx';
import { buildStoredZip, crc32 } from './zip';

interface Row {
  id: number;
  name: string;
  note: string;
  when: Date;
}

const COLUMNS: PixelExportColumn[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'note', header: 'Note' },
  { key: 'when', header: 'When', type: 'date' },
];

const ROWS: Row[] = [
  { id: 1, name: 'Ada', note: 'a,b', when: new Date(2020, 0, 15) },
  { id: 2, name: 'Linus', note: 'ok', when: new Date(2021, 5, 1) },
];

describe('pixel export serialize', () => {
  it('serializes CSV with quoting and Excel-safe date text', () => {
    const csv = serializeToCsv(ROWS, COLUMNS);
    expect(csv).toContain('ID,Name,Note,When');
    expect(csv).toContain('"=""2020-01-15"""');
    expect(csv).not.toContain('T00:00:00');
  });

  it('formatExportDate: exact YYYY-MM-DD is the local civil day (no UTC-midnight shift)', () => {
    // Exact date-only string: must round-trip as the same day in any timezone.
    expect(formatExportDate('2024-03-05')).toBe('2024-03-05');
    expect(formatExportDate(new Date(2024, 2, 5))).toBe('2024-03-05');
  });

  it('formatExportDate: full ISO string resolves to viewer-local civil day', () => {
    // 2024-03-05T12:00:00.000Z is noon UTC — local civil day is 2024-03-05 in every
    // timezone from UTC-11 to UTC+11. This proves full ISO is not naively sliced to 10 chars.
    expect(formatExportDate('2024-03-05T12:00:00.000Z')).toBe('2024-03-05');
  });

  it('excelLiteralTextCsvCell wraps values for Excel text display', () => {
    expect(excelLiteralTextCsvCell('2024-03-05')).toBe('"=""2024-03-05"""');
  });

  it('optionally prefixes a UTF-8 BOM on CSV', () => {
    expect(serializeToCsv(ROWS, COLUMNS).startsWith('\uFEFF')).toBe(true);
    expect(serializeToCsv(ROWS, COLUMNS, { csvBom: false }).startsWith('\uFEFF')).toBe(false);
  });

  it('serializes TSV without tabs in cell values', () => {
    const tsv = serializeToTsv([{ name: 'A\tB' }], [{ key: 'name', header: 'Name' }]);
    expect(tsv.split('\n')[1]).toBe('A B');
  });

  it('serializes JSON keyed by headers', () => {
    const parsed = JSON.parse(serializeToJson(ROWS, COLUMNS, { prettyJson: false })) as Array<
      Record<string, unknown>
    >;
    expect(parsed[0]['Name']).toBe('Ada');
    expect(parsed[0]['When']).toBe('2020-01-15');
  });

  it('serializeTable routes text formats', () => {
    expect(serializeTable(ROWS, COLUMNS, 'csv')).toContain('ID,Name');
    expect(serializeTable(ROWS, COLUMNS, 'json')).toContain('"Name"');
  });
});

describe('excel date serials', () => {
  it('maps calendar dates to Excel serials', () => {
    // 2020-01-15 → known serial 43845 in the 1900 date system
    expect(toExcelDateSerial('2020-01-15')).toBe(43845);
    expect(toExcelDateSerial(new Date(2020, 0, 15))).toBe(43845);
  });

  it('full ISO string resolves to viewer-local civil day serial (not naïve UTC slice)', () => {
    // T12:00Z is noon UTC — viewer-local civil day is 2020-01-15 in any ±11 zone → same serial.
    expect(toExcelDateSerial('2020-01-15T12:00:00.000Z')).toBe(43845);
  });

  it('returns null for empty / invalid values', () => {
    expect(toExcelDateSerial(null)).toBeNull();
    expect(toExcelDateSerial('')).toBeNull();
    expect(toExcelDateSerial('not-a-date')).toBeNull();
  });
});

describe('stored ZIP / xlsx', () => {
  it('crc32 is stable for a known string', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('buildStoredZip starts with a local file header signature', async () => {
    const blob = buildStoredZip({ 'a.txt': 'hello' });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });

  it('buildXlsxBlob is a ZIP containing worksheet + styles and date serials', async () => {
    const blob = await buildXlsxBlob(ROWS, COLUMNS, { sheetName: 'People' });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    const asText = new TextDecoder().decode(bytes);
    expect(asText).toContain('xl/worksheets/sheet1.xml');
    expect(asText).toContain('xl/styles.xml');
    expect(asText).toContain('43845'); // 2020-01-15 serial
    expect(asText).toContain('formatCode="yyyy-mm-dd"');
    expect(asText).toContain('customWidth="1"');
  });

  it('sanitizes illegal sheet name characters', () => {
    expect(sanitizeExcelSheetName('A/B*C')).toBe('A_B_C');
    expect(sanitizeExcelSheetName('x'.repeat(40)).length).toBe(31);
  });
});

describe('saveAs / exportTable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saveAs clicks an anchor with the given file name', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.fn();
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === 'a') {
        el.click = click;
      }
      return el;
    });

    saveAs('hello', 'note.txt', 'text/plain');
    expect(click).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('exportTable excel appends .xlsx', async () => {
    const downloads: string[] = [];
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === 'a') {
        el.click = function (this: HTMLAnchorElement) {
          downloads.push(this.download);
        };
      }
      return el;
    });

    exportTable(ROWS, COLUMNS, 'excel', { fileName: 'sheet' });
    await vi.waitFor(() => {
      expect(downloads).toEqual(['sheet.xlsx']);
    });
  });
});

describe('PixelExportService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('merges PIXEL_EXPORT_CONFIG defaults', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PIXEL_EXPORT_CONFIG, useValue: { defaultFileName: 'policies', csvBom: false } },
      ],
    });
    const service = TestBed.inject(PixelExportService);
    expect(service.config.defaultFileName).toBe('policies');
    expect(service.config.csvBom).toBe(false);
    expect(service.serializeCsv(ROWS, COLUMNS).startsWith('\uFEFF')).toBe(false);
  });

  it('buildExcelBlob returns an xlsx ZIP blob', async () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(PixelExportService);
    const blob = await service.buildExcelBlob(ROWS, COLUMNS);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it('exportTable uses .xlsx for excel', async () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(PixelExportService);
    const downloads: string[] = [];
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === 'a') {
        el.click = function (this: HTMLAnchorElement) {
          downloads.push(this.download);
        };
      }
      return el;
    });

    service.exportTable(ROWS, COLUMNS, 'csv', { fileName: 'out' });
    service.exportTable(ROWS, COLUMNS, 'excel', { fileName: 'out' });
    await vi.waitFor(() => {
      expect(downloads).toEqual(['out.csv', 'out.xlsx']);
    });
  });
});
