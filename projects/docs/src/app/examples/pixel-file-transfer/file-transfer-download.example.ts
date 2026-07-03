import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PixelButtonComponent, PixelDownloadService } from 'pixel-ui';

@Component({
  selector: 'docs-file-transfer-download-example',
  standalone: true,
  imports: [PixelButtonComponent],
  template: `
    <p class="hint">
      Each button generates a file in the browser and downloads it through the service
      (queue → progress → saveAs). No backend required.
    </p>
    <div class="grid">
      <pixel-button appearance="outline" leadingIcon="description" (click)="downloadCsv()">Export CSV</pixel-button>
      <pixel-button appearance="outline" leadingIcon="data_object" (click)="downloadJson()">Export JSON</pixel-button>
      <pixel-button appearance="outline" leadingIcon="article" (click)="downloadText()">Download .txt</pixel-button>
      <pixel-button appearance="outline" leadingIcon="download_for_offline" (click)="downloadBlobPreview()">
        Get Blob (no save)
      </pixel-button>
    </div>

    @if (lastBlobInfo()) {
      <p class="info">downloadBlob() returned: <strong>{{ lastBlobInfo() }}</strong></p>
    }
  `,
  styles: `
    .hint { margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }
    .grid { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .info { margin-block-start: 0.75rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTransferDownloadExample {
  private readonly downloads = inject(PixelDownloadService);
  protected readonly lastBlobInfo = signal('');

  protected downloadCsv(): void {
    const rows = [['id', 'name', 'amount'], ['1', 'Policy A', '1200'], ['2', 'Policy B', '980']];
    const csv = rows.map((r) => r.join(',')).join('\n');
    this.transfer(csv, 'text/csv', 'policies.csv');
  }

  protected downloadJson(): void {
    const json = JSON.stringify({ generatedAt: new Date().toISOString(), items: [1, 2, 3] }, null, 2);
    this.transfer(json, 'application/json', 'export.json');
  }

  protected downloadText(): void {
    this.transfer('Hello from the Pixel File Transfer service.', 'text/plain', 'note.txt');
  }

  protected async downloadBlobPreview(): Promise<void> {
    const url = this.toUrl('preview content', 'text/plain');
    const blob = await this.downloads.downloadBlob(url, { fileName: 'preview.txt' });
    this.lastBlobInfo.set(`${blob.size} bytes, type "${blob.type || 'text/plain'}"`);
    URL.revokeObjectURL(url);
  }

  /** Generate a file in-browser and run it through the download queue + saveAs. */
  private transfer(content: string, type: string, fileName: string): void {
    const url = this.toUrl(content, type);
    this.downloads.download(url, { fileName });
    // Revoke shortly after the queue has consumed it.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  private toUrl(content: string, type: string): string {
    return URL.createObjectURL(new Blob([content], { type }));
  }
}
