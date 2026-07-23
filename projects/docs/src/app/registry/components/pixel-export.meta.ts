import { DocComponentMeta } from '../types';
import { EXPORT_EXAMPLES } from '../../examples/pixel-export';

export const EXPORT_META: DocComponentMeta = {
  id: 'pixel-export',
  title: 'Export',
  selector: 'PixelExportService',
  category: 'advanced',
  status: 'stable',
  summary:
    'UI-independent serialize + saveAs helpers for tabular data (CSV / TSV / JSON / SpreadsheetML Excel), with an injectable PixelExportService facade. Not a network download queue.',
  overview: [
    'Use PixelExportService (or the pure functions) to turn in-memory rows + column descriptors into downloadable files or clipboard text.',
    'Excel output is SpreadsheetML 2003 (.xls) — opens in Excel with no SheetJS dependency.',
    'Optional PIXEL_EXPORT_CONFIG sets default file name, pretty JSON, CSV UTF-8 BOM, and sheet name.',
    'pixel-data-grid exportable menus use this package under the hood. For HTTP download queues, progress, retry, and ZIP, use File Transfer instead.',
  ],
  useCases: [
    'Export reports or query results without a grid',
    'Shared serialize/saveAs for multiple apps / micro-frontends',
    'Clipboard TSV for paste into spreadsheets',
  ],
  themingNotes: [
    'No UI — nothing to theme. Pair with pixel-button (or a grid toolbar) for presentation.',
  ],
  accessibilityNotes: [
    'Service layer has no DOM; give export buttons clear labels in your UI.',
  ],
  imports: ['PixelExportService'],
  inputs: [],
  outputs: [],
  serviceName: 'PixelExportService',
  serviceApi: [
    {
      name: 'exportTable',
      signature:
        'exportTable(rows, columns, format: PixelExportFormat, options?: PixelExportTableOptions): void',
      description: 'Serialize and trigger a browser download (csv | tsv | json | excel).',
    },
    {
      name: 'serialize / serializeCsv / serializeTsv / serializeJson / serializeExcel',
      signature: '(rows, columns, options?): string',
      description: 'Serialize without downloading.',
    },
    {
      name: 'saveAs',
      signature: 'saveAs(data: Blob | string, fileName: string, mime?: string): void',
      description: 'Local Save As (also used by File Transfer saveBlob).',
    },
    {
      name: 'copyText',
      signature: 'copyText(text: string): Promise<void>',
      description: 'Copy text to the clipboard.',
    },
    {
      name: 'config',
      signature: 'ResolvedPixelExportConfig',
      description: 'Merged defaults from PIXEL_EXPORT_CONFIG.',
    },
  ],
  examples: EXPORT_EXAMPLES,
};
