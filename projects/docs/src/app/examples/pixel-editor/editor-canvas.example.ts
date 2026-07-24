import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelEditorComponent, type PixelEditorDoc } from 'pixel-ui';

/** Reproduces the UX mock canvas: heading, lists, info panel, tasks. */
@Component({
  selector: 'docs-editor-canvas-example',
  imports: [PixelEditorComponent],
  template: `
    <pixel-editor
      label="Project update"
      placeholder="Write a description…"
      [value]="doc()"
      saveState="saved"
      savedAtLabel="Just now"
      (valueChange)="doc.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorCanvasExample {
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
          { type: 'text', text: ' this sprint, including the rich text editor.' },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Toolbar chrome with pixel menus' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Structured ' },
                  {
                    type: 'text',
                    marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
                    text: 'JSON documents',
                  },
                ],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Panels, tasks, and alignment' }],
              },
            ],
          },
        ],
      },
      {
        type: 'panel',
        attrs: { variant: 'info' },
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Tip: use Insert → Panel for callouts. Variants: info, note, success, warning, error.',
              },
            ],
          },
        ],
      },
      {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: true },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Ship Phase 2 toolbar menus' }],
              },
            ],
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Polish panels and task lists' }],
              },
            ],
          },
        ],
      },
    ],
  });
}
