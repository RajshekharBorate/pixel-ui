import { DocComponentMeta } from '../types';
import { FILE_UPLOAD_EXAMPLES } from '../../examples/pixel-file-upload';

export const FILE_UPLOAD_META: DocComponentMeta = {
  id: 'pixel-file-upload',
  title: 'File Upload',
  selector: 'pixel-file-upload',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Accessible file picker with drag-and-drop dropzone and button variants, built-in type/size/count validation, image previews, and Angular form integration.',
  overview: [
    'Two variants: dropzone (large drag-and-drop zone with click-to-browse) and button (compact trigger with file list below).',
    'Built-in validation via accept (MIME types and extensions), maxSize (bytes per file), and maxFiles inputs — rejected files emit via filesChange with error reasons.',
    'Image files show inline thumbnails via createObjectURL; all other types display a Material Symbol icon matching their category.',
    'Implements ControlValueAccessor — single mode yields File | null, multiple mode yields File[]. Validators.required works out of the box.',
    'Object URLs are revoked on component destroy to prevent memory leaks.',
  ],
  useCases: [
    'Profile photo and avatar upload in account settings',
    'Document attachment in forms (PDFs, spreadsheets, Word files)',
    'Multi-image upload for product listings or galleries',
    'File picker button in compact inline forms',
  ],
  themingNotes: [
    'Dropzone border, background, and drag-over state are all driven by --pixel-upload-* CSS custom properties.',
    'Error state switches border and background to the error token automatically.',
    'Dark mode is handled via prefers-color-scheme and data-theme selectors.',
  ],
  accessibilityNotes: [
    'The dropzone div has role="button", tabindex="0", and responds to Enter/Space for keyboard activation.',
    'The hidden native <input type="file"> provides native OS file picker accessibility.',
    'Each remove button has an aria-label of "Remove {filename}" for screen readers.',
    'The file list uses role="list" and aria-label="Selected files".',
    'Error messages use role="alert" for immediate screen-reader announcement.',
  ],
  imports: ['PixelFileUploadComponent'],
  inputs: [
    { name: 'variant',      type: "'dropzone' | 'button'",  defaultValue: "'dropzone'", description: 'Visual variant.' },
    { name: 'size',         type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'",  description: 'Density scale controlling dropzone height.' },
    { name: 'value',        type: 'File | File[] | null',   defaultValue: 'null',      description: 'Controlled value for standalone use.' },
    { name: 'accept',       type: 'string',                 defaultValue: "''",        description: 'Accepted MIME types or extensions e.g. "image/*, .pdf". Empty = all.' },
    { name: 'multiple',     type: 'boolean',                defaultValue: 'false',     description: 'Allow selecting multiple files.' },
    { name: 'maxSize',      type: 'number',                 defaultValue: '0',         description: 'Maximum file size per file in bytes. 0 = no limit.' },
    { name: 'maxFiles',     type: 'number',                 defaultValue: '0',         description: 'Maximum total number of files. 0 = no limit.' },
    { name: 'maxTotalSize', type: 'number',                 defaultValue: '0',         description: 'Maximum combined size of all selected files in bytes. 0 = no limit.' },
    { name: 'validators',   type: '((file: File) => string | null)[]', defaultValue: '[]', description: 'Custom per-file validators; return an error message or null.' },
    { name: 'label',        type: 'string',                 defaultValue: "''",        description: 'Visible label above the upload area.' },
    { name: 'helperText',   type: 'string',                 defaultValue: "''",        description: 'Hint text below the upload area.' },
    { name: 'dropText',     type: 'string',                 defaultValue: "''",        description: 'Custom primary text inside the dropzone.' },
    { name: 'buttonLabel',  type: 'string',                 defaultValue: "''",        description: 'Custom label for the trigger button (button variant).' },
    { name: 'showPreview',  type: 'boolean',                defaultValue: 'true',      description: 'Show image thumbnails for image files.' },
    { name: 'autoTransfer', type: 'boolean',                defaultValue: 'false',     description: 'Auto-queue accepted files on PixelFileTransferService (lazily resolved). See the File Transfer page.' },
    { name: 'transferUrl',  type: 'string',                 defaultValue: "''",        description: 'Upload URL passed to the transfer engine when autoTransfer is on.' },
    { name: 'disabled',     type: 'boolean',                defaultValue: 'false',     description: 'Disables all interaction.' },
    { name: 'showSkeleton', type: 'boolean',                defaultValue: 'false',     description: 'Show skeleton placeholder while loading.' },
  ],
  outputs: [
    { name: 'filesChange',    type: 'PixelFileSelectEvent', description: 'Emits on every selection change with accepted and rejected file arrays.' },
    { name: 'transferQueued', type: 'string[]',             description: 'When autoTransfer is on, emits the transfer task ids created for the accepted files.' },
  ],
  examples: FILE_UPLOAD_EXAMPLES,
};
