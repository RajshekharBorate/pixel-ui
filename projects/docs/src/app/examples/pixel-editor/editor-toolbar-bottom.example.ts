import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelEditorComponent, type PixelEditorDoc } from 'pixel-ui';

@Component({
  selector: 'docs-editor-toolbar-bottom-example',
  imports: [PixelEditorComponent],
  template: `
    <pixel-editor
      label="Comment"
      placeholder="Write a comment…"
      toolbarPosition="bottom"
      [value]="doc()"
      (valueChange)="doc.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorToolbarBottomExample {
  protected readonly doc = signal<PixelEditorDoc>({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Toolbar sits under the canvas; the status bar is hidden.' }],
      },
    ],
  });
}
