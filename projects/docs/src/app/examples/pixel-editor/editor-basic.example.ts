import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelEditorComponent, type PixelEditorDoc } from 'pixel-ui';

@Component({
  selector: 'docs-editor-basic-example',
  imports: [PixelEditorComponent],
  template: `
    <pixel-editor
      label="Description"
      placeholder="Write a description…"
      [value]="doc()"
      saveState="saved"
      savedAtLabel="Just now"
      (valueChange)="doc.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorBasicExample {
  protected readonly doc = signal<PixelEditorDoc>({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Project Update' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'We shipped new ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'UI components' },
          { type: 'text', text: ' this sprint.' },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Editor shell' }] }],
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'TipTap binding' }] }],
          },
        ],
      },
    ],
  });
}
