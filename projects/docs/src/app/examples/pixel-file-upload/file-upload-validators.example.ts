import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelFileUploadComponent } from 'pixel-ui';

@Component({
  selector: 'docs-file-upload-validators-example',
  imports: [PixelFileUploadComponent],
  template: `
    <pixel-file-upload
      label="Upload assets"
      [multiple]="true"
      [maxTotalSize]="5242880"
      [validators]="validators"
      helperText="Combined size ≤ 5 MB · filenames must not contain spaces."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadValidatorsExample {
  // Custom per-file validators run after the built-in accept / size / count checks.
  protected readonly validators = [
    (file: File): string | null =>
      file.name.includes(' ') ? 'Filename cannot contain spaces' : null,
    (file: File): string | null =>
      file.name.length > 40 ? 'Filename too long (max 40 chars)' : null,
  ];
}
