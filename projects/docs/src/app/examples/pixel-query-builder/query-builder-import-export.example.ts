import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  exportQuery,
  importQuery,
  nativeDateAdapterProviders,
  parseQueryExportJson,
  serializeQueryExport,
  PixelButtonComponent,
  PixelInputComponent,
  PixelQueryBuilderComponent,
  PixelQueryGroup,
} from 'pixel-ui';
import { createDocsSampleQuery, docsQueryBuilderConfig } from './query-builder-shared';

@Component({
  selector: 'docs-query-builder-import-export-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelInputComponent, PixelQueryBuilderComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './query-builder-import-export.example.html',
  styleUrl: './query-builder-import-export.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderImportExportExample {
  protected readonly config = docsQueryBuilderConfig;
  protected readonly query = signal<PixelQueryGroup>(createDocsSampleQuery());
  protected readonly exportJson = computed(() =>
    serializeQueryExport(exportQuery(this.query()), true),
  );
  protected readonly importDraft = signal('');
  protected readonly importError = signal<string | null>(null);
  protected readonly exportNotice = signal<string | null>(null);

  protected onCopyExport(): void {
    const json = this.exportJson();
    void navigator.clipboard?.writeText(json).then(() => {
      this.exportNotice.set('Copied to clipboard');
    });
  }

  protected onDownloadExport(): void {
    const json = this.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'query-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  protected onImportDraftChange(value: string): void {
    this.importDraft.set(value);
    this.importError.set(null);
  }

  protected onApplyImport(): void {
    this.applyImport(this.importDraft());
  }

  protected onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    void file.text().then((text) => {
      this.importDraft.set(text);
      this.applyImport(text);
    });
  }

  private applyImport(json: string): void {
    const result = parseQueryExportJson(json);
    if (!result.ok) {
      this.importError.set(result.error);
      return;
    }
    this.query.set(importQuery(result.export, this.config));
    this.importDraft.set('');
    this.importError.set(null);
    this.exportNotice.set('Query imported successfully');
  }
}
