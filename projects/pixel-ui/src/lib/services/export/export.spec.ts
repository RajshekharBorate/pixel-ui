import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PixelExportService } from './export.service';
import { PIXEL_EXPORT_CONFIG } from './export.tokens';
import type { PixelExportColumn } from './export.types';
import { exportTable, serializeTable } from './export';
import { saveAs } from './save-as';
import { serializeToCsv, serializeToJson, serializeToTsv } from './serialize';
import { buildXlsxBlob, sanitizeExcelSheetName } from './xlsx';
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
  { key: 'when', header: 'When' },
];

const ROWS: Row[] = [
  { id: 1, name: 'Ada', note: 'a,b', when: new Date('2020-01-15T00:00:00.000Z') },
  { id: 2, name: 'Linus', note: 'ok', when: new Date('2021-06-01T00:00:00.000Z') },
];

describe('pixel export serialize', () => {
  it('serializes CSV with quoting and ISO dates', () => {
    const csv = serializeToCsv(ROWS, COLUMNS);
    expect(csv).toContain('ID,Name,Note,When');
    expect(csv).toContain('1,Ada,"a,b",2020-01-15T00:00:00.000Z');
  });

  it('optionally prefixes a UTF-8 BOM on CSV', () => {
    expect(serializeToCsv(ROWS, COLUMNS, { csvBom: true }).startsWith('\uFEFF')).toBe(true);
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
  });

  it('serializeTable routes text formats', () => {
    expect(serializeTable(ROWS, COLUMNS, 'csv')).toContain('ID,Name');
    expect(serializeTable(ROWS, COLUMNS, 'json')).toContain('"Name"');
  });
});

describe('stored ZIP / xlsx', () => {
  it('crc32 is stable for a known string', () => {
    // CRC of "123456789" is the common check value 0xcbf43926
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('buildStoredZip starts with a local file header signature', async () => {
    const blob = buildStoredZip({ 'a.txt': 'hello' });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });

  it('buildXlsxBlob is a ZIP containing worksheet XML', async () => {
    const blob = buildXlsxBlob(ROWS, COLUMNS, { sheetName: 'People' });
    expect(blob.type).toContain('zip');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    const asText = new TextDecoder().decode(bytes);
    expect(asText).toContain('xl/worksheets/sheet1.xml');
    expect(asText).toContain('Ada');
    expect(asText).toContain('inlineStr');
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

  it('exportTable excel appends .xlsx', () => {
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
    expect(downloads).toEqual(['sheet.xlsx']);
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
        { provide: PIXEL_EXPORT_CONFIG, useValue: { defaultFileName: 'policies', csvBom: true } },
      ],
    });
    const service = TestBed.inject(PixelExportService);
    expect(service.config.defaultFileName).toBe('policies');
    expect(service.serializeCsv(ROWS, COLUMNS).startsWith('\uFEFF')).toBe(true);
  });

  it('buildExcelBlob returns an xlsx ZIP blob', async () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(PixelExportService);
    const blob = service.buildExcelBlob(ROWS, COLUMNS);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it('exportTable uses .xlsx for excel', () => {
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
    expect(downloads).toEqual(['out.csv', 'out.xlsx']);
  });
});
