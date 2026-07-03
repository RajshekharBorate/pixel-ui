import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PixelButtonComponent, PixelDownloadService } from 'pixel-ui';
import { storeZip } from './store-zip.util';

@Component({
  selector: 'docs-file-transfer-zip-example',
  standalone: true,
  imports: [PixelButtonComponent],
  template: `
    <p class="hint">
      Generates three files in the browser, fetches them through the download queue
      (capped at parallelDownloads), bundles them into a ZIP, and saves it.
    </p>
    <pixel-button appearance="solid" leadingIcon="folder_zip" [disabled]="busy()" (click)="zip()">
      {{ busy() ? 'Zipping…' : 'Download attachments.zip' }}
    </pixel-button>
  `,
  styles: `.hint { margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTransferZipExample {
  private readonly downloads = inject(PixelDownloadService);
  protected readonly busy = signal(false);

  protected async zip(): Promise<void> {
    this.busy.set(true);
    const sources = [
      this.makeFile('readme.txt', 'Bundled by the Pixel File Transfer service.'),
      this.makeFile('data.csv', 'id,name\n1,Alpha\n2,Beta'),
      this.makeFile('config.json', JSON.stringify({ ok: true }, null, 2)),
    ];
    try {
      // downloadZip fetches each source (bounded concurrency) then calls our zipper.
      await this.downloads.downloadZip(sources, 'attachments.zip', storeZip);
    } finally {
      sources.forEach((s) => URL.revokeObjectURL(s.url));
      this.busy.set(false);
    }
  }

  private makeFile(name: string, content: string) {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    return { id: name, url, fileName: name };
  }
}
