import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelFileUploadComponent } from 'pixel-ui';

@Component({
  selector: 'docs-file-upload-button-example',
  standalone: true,
  imports: [PixelFileUploadComponent],
  template: `
    <pixel-file-upload
      variant="button"
      label="Attachment"
      accept=".pdf,.docx,.xlsx"
      helperText="PDF, Word, or Excel documents."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadButtonExample {}
