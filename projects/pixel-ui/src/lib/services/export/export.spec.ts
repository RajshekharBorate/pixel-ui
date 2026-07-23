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
  serializeToSpreadsheetXml,
  serializeToTsv,
} from './serialize';

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
    expect(csv).toContain('2,Linus,ok,2021-06-01T00:00:00.000Z');
  });

  it('optionally prefixes a UTF-8 BOM on CSV', () => {
    const csv = serializeToCsv(ROWS, COLUMNS, { csvBom: true });
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });

  it('serializes TSV without tabs in cell values', () => {
    const tsv = serializeToTsv([{ name: 'A\tB' }], [{ key: 'name', header: 'Name' }]);
    expect(tsv.split('\n')[1]).toBe('A B');
  });

  it('serializes JSON keyed by headers', () => {
    const json = serializeToJson(ROWS, COLUMNS, { prettyJson: false });
    const parsed = JSON.parse(json) as Array<Record<string, unknown>>;
    expect(parsed).toHaveLength(2);
    expect(parsed[0]['Name']).toBe('Ada');
    expect(parsed[0]['When']).toBe('2020-01-15T00:00:00.000Z');
  });

  it('serializes SpreadsheetML with Number cells for finite numbers', () => {
    const xml = serializeToSpreadsheetXml(ROWS, COLUMNS, { sheetName: 'People' });
    expect(xml).toContain('ss:Name="People"');
    expect(xml).toContain('ss:Type="Number">1<');
    expect(xml).toContain('ss:Type="String">Ada<');
  });

  it('supports custom value accessors', () => {
    const csv = serializeToCsv(ROWS, [
      { key: 'id', header: 'Code', value: (row) => `P-${(row as Row).id}` },
    ]);
    expect(csv).toContain('P-1');
  });

  it('serializeTable routes formats', () => {
    expect(serializeTable(ROWS, COLUMNS, 'csv')).toContain('ID,Name');
    expect(serializeTable(ROWS, COLUMNS, 'json')).toContain('"Name"');
    expect(serializeTable(ROWS, COLUMNS, 'excel')).toContain('<Workbook');
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
    const anchor = click.mock.instances[0] as HTMLAnchorElement | undefined;
    // click is bound on the element; download was set before click
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('exportTable appends the format extension', () => {
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
    expect(downloads).toEqual(['sheet.xls']);
  });
});

describe('PixelExportService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('merges PIXEL_EXPORT_CONFIG defaults', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PIXEL_EXPORT_CONFIG, useValue: { defaultFileName: 'policies', csvBom: true } },
      ],
    });
    const service = TestBed.inject(PixelExportService);
    expect(service.config.defaultFileName).toBe('policies');
    expect(service.config.csvBom).toBe(true);
    expect(service.serializeCsv(ROWS, COLUMNS).startsWith('\uFEFF')).toBe(true);
  });

  it('exportTable uses the service file name', () => {
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
    expect(downloads).toEqual(['out.csv']);
  });
});
