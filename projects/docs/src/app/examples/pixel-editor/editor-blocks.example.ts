import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelEditorComponent,
  type PixelEditorDoc,
} from 'pixel-ui/editor';

@Component({
  selector: 'docs-editor-blocks-example',
  imports: [PixelEditorComponent],
  template: `
    <pixel-editor
      label="Specification"
      placeholder="Add a code sample or table…"
      [value]="doc()"
      (valueChange)="doc.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorBlocksExample {
  protected readonly doc = signal<PixelEditorDoc>({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Content blocks' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Insert → Code block picks a language (lowlight). Insert → Table creates a 3×3 grid with a header row. Tab moves between cells.',
          },
        ],
      },
      {
        type: 'codeBlock',
        attrs: { language: 'typescript' },
        content: [
          {
            type: 'text',
            text: "const greet = (name: string) => `Hello, ${name}!`;\nconsole.log(greet('pixel'));",
          },
        ],
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableHeader',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Feature' }] }],
              },
              {
                type: 'tableHeader',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Status' }] }],
              },
              {
                type: 'tableHeader',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Notes' }] }],
              },
            ],
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Syntax highlight' }] }],
              },
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ready' }] }],
              },
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'lowlight common set' }] }],
              },
            ],
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tables' }] }],
              },
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ready' }] }],
              },
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Header + Tab nav' }] }],
              },
            ],
          },
        ],
      },
      { type: 'horizontalRule' },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Escape exits fullscreen when the editor is expanded.' }],
      },
    ],
  });
}
