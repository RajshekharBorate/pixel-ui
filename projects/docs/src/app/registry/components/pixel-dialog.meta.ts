import { DocComponentMeta } from '../types';
import { DIALOG_EXAMPLES } from '../../examples/pixel-dialog';

export const DIALOG_META: DocComponentMeta = {
  id: 'pixel-dialog',
  title: 'Dialog',
  selector: 'pixel-dialog',
  category: 'layout',
  status: 'stable',
  summary:
    'Accessible modal dialog with scrim, focus trap, custom slots, bottom-sheet mode, and imperative PixelDialogService.',
  overview: [
    'pixel-dialog two-way binds open and relocates the overlay to document.body.',
    'Project pixelDialogHeader and pixelDialogFooter for branded chrome around scrollable body content.',
    'pixel-confirm-dialog covers confirmation flows with danger and loading states.',
  ],
  useCases: [
    'Confirmation and alert dialogs',
    'Mobile bottom-sheet filters and actions',
    'Imperative dialogs via PixelDialogService.open()',
  ],
  themingNotes: [
    'Sizes sm, md, lg, and fullscreen map to max-width and padding tokens.',
    'Bottom-sheet uses distinct surface radius and drag affordance styling.',
  ],
  accessibilityNotes: [
    'Traps focus while open and restores it on close.',
    'Escape and scrim dismiss when dismissable is true.',
    'confirm-dialog uses role="alertdialog" with labelled actions.',
  ],
  imports: ['PixelDialogComponent', 'PixelConfirmDialogComponent', 'PixelDialogService'],
  serviceName: 'PixelDialogService',
  serviceApi: [
    { name: 'open', signature: '<T, D, R>(component: Type<T>, config?: PixelDialogConfig<D>) => PixelDialogRef<R, T>', description: 'Open any component in a modal shell; inject PixelDialogRef and PIXEL_DIALOG_DATA in the opened component.' },
    { name: 'closeAll', signature: '() => void', description: 'Close every open dialog.' },
    { name: 'openDialogs', signature: 'readonly PixelDialogRef[]', description: 'All currently-open dialog refs in open order.' },
  ],
  inputs: [
    { name: 'open', type: 'boolean', defaultValue: 'false', description: 'Open state (two-way bindable).' },
    { name: 'title', type: 'string', defaultValue: "''", description: 'Default header title.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'fullscreen'", defaultValue: "'md'", description: 'Dialog width preset.' },
    { name: 'position', type: "'center' | 'bottom-sheet'", defaultValue: "'center'", description: 'Anchoring strategy.' },
    { name: 'dismissable', type: 'boolean', defaultValue: 'true', description: 'Allow scrim, Escape, and close button dismissal.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible label when title is omitted.' },
    { name: 'ariaDescribedBy', type: 'string', defaultValue: "''", description: 'Ids describing the dialog body.' },
    { name: 'panelClass', type: 'string', defaultValue: "''", description: 'Extra class on the dialog surface.' },
    { name: 'role', type: "'dialog' | 'alertdialog'", defaultValue: "'dialog'", description: 'ARIA role — alertdialog for confirmations.' },
  ],
  outputs: [
    { name: 'openChange', type: 'boolean', description: 'Emits when open state changes.' },
    { name: 'closed', type: 'void', description: 'Emits when the dialog closes.' },
  ],
  examples: DIALOG_EXAMPLES,
};
