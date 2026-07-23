/** Tabular export format. `excel` emits a real Office Open XML workbook (`.xlsx`). */
export type PixelExportFormat = 'csv' | 'tsv' | 'json' | 'excel';

/**
 * Generic column descriptor for serializers. Keep this free of UI / grid types so
 * any table-like data can export without depending on `pixel-data-grid`.
 */
export interface PixelExportColumn {
  /** Stable field key (used as default header and default row accessor). */
  readonly key: string;
  /** Column header label; defaults to `key`. */
  readonly header?: string;
  /** Optional value accessor; defaults to `(row as Record)[key]`. */
  readonly value?: (row: unknown) => unknown;
  /**
   * Semantic type — when `'date'`, CSV cells are written so Excel keeps them as visible
   * `YYYY-MM-DD` text (avoids date-serial + `######` placeholders).
   */
  readonly type?: 'text' | 'number' | 'date' | 'boolean';
}

/** Options for delimited / JSON / Excel serializers. */
export interface PixelSerializeOptions {
  /** Pretty-print JSON (2-space indent). @default true */
  readonly prettyJson?: boolean;
  /** Prepend UTF-8 BOM to CSV (helps Excel detect encoding). @default true for friendlier Excel opens */
  readonly csvBom?: boolean;
  /** Worksheet name for Excel (`.xlsx`). @default 'Sheet1' */
  readonly sheetName?: string;
}

/** Options for {@link PixelExportService.exportTable} / {@link exportTable}. */
export interface PixelExportTableOptions extends PixelSerializeOptions {
  /** Base file name without extension. @default from config / `'export'` */
  readonly fileName?: string;
}

/** Injectable defaults for {@link PixelExportService}. */
export interface PixelExportConfig {
  readonly defaultFileName?: string;
  readonly prettyJson?: boolean;
  readonly csvBom?: boolean;
  readonly sheetName?: string;
}

/** Resolved export config (all fields required). */
export type ResolvedPixelExportConfig = Required<PixelExportConfig>;

export const PIXEL_EXPORT_DEFAULTS: ResolvedPixelExportConfig = {
  defaultFileName: 'export',
  prettyJson: true,
  csvBom: true,
  sheetName: 'Sheet1',
};

/** MIME types used when saving serialized content. */
export const PIXEL_EXPORT_MIME: Readonly<Record<PixelExportFormat, string>> = {
  csv: 'text/csv;charset=utf-8;',
  tsv: 'text/tab-separated-values;charset=utf-8;',
  json: 'application/json',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/** File extensions for each format. */
export const PIXEL_EXPORT_EXTENSION: Readonly<Record<PixelExportFormat, string>> = {
  csv: 'csv',
  tsv: 'tsv',
  json: 'json',
  excel: 'xlsx',
};
