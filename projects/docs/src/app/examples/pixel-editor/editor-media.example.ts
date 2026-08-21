import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelEditorComponent,
  type PixelEditorDoc,
  type PixelEditorImageRequest,
} from 'pixel-ui/editor';

@Component({
  selector: 'docs-editor-media-example',
  imports: [PixelEditorComponent],
  template: `
    <pixel-editor
      label="Announcement"
      placeholder="Add a link, color, or image…"
      [value]="doc()"
      (valueChange)="doc.set($event)"
      (imageRequest)="onImage($event)"
    />
    @if (lastImage()) {
      <p class="hint">Last image request: {{ lastImage() }}</p>
    }
  `,
  styles: `
    .hint {
      margin: 0.75rem 0 0;
      font-size: 0.8125rem;
      color: var(--pixel-sys-on-surface-variant, #444);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorMediaExample {
  protected readonly lastImage = signal('');

  protected readonly doc = signal<PixelEditorDoc>({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Try ' },
          {
            type: 'text',
            marks: [{ type: 'textStyle', attrs: { color: 'var(--pixel-editor-ink-primary)' } }],
            text: 'colored text',
          },
          { type: 'text', text: ', ' },
          {
            type: 'text',
            marks: [{ type: 'highlight', attrs: { color: 'var(--pixel-editor-mark-yellow)' } }],
            text: 'highlights',
          },
          { type: 'text', text: ', and ' },
          {
            type: 'text',
            marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
            text: 'links',
          },
          { type: 'text', text: '.' },
        ],
      },
    ],
  });

  protected onImage(req: PixelEditorImageRequest): void {
    this.lastImage.set(`${req.source}: ${req.src ?? req.file?.name ?? ''}`);
  }
}
