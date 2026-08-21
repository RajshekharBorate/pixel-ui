import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelEditorComponent,
  type PixelEditorDoc,
  type PixelEditorMentionItem,
} from 'pixel-ui/editor';

@Component({
  selector: 'docs-editor-inserts-example',
  imports: [PixelEditorComponent],
  template: `
    <pixel-editor
      label="Team note"
      placeholder="Type @ to mention someone, or use the toolbar…"
      [value]="doc()"
      [mentionItems]="people()"
      (valueChange)="doc.set($event)"
      (mentionQuery)="onMentionQuery($event.query)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorInsertsExample {
  private readonly allPeople: readonly PixelEditorMentionItem[] = [
    { id: 'ada', label: 'Ada Lovelace', subtitle: 'Engineering' },
    { id: 'grace', label: 'Grace Hopper', subtitle: 'Platform' },
    { id: 'alan', label: 'Alan Turing', subtitle: 'Research' },
    { id: 'katherine', label: 'Katherine Johnson', subtitle: 'Ops' },
  ];

  protected readonly people = signal<readonly PixelEditorMentionItem[]>(this.allPeople);

  protected readonly doc = signal<PixelEditorDoc>({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Ping ' },
          {
            type: 'mention',
            attrs: { id: 'ada', label: 'Ada Lovelace' },
          },
          { type: 'text', text: ' before ' },
          {
            type: 'dateChip',
            attrs: { value: '2026-07-24' },
          },
          { type: 'text', text: ' 🚀' },
        ],
      },
    ],
  });

  protected onMentionQuery(query: string): void {
    const q = query.trim().toLowerCase();
    this.people.set(
      q
        ? this.allPeople.filter(
            (p) =>
              p.label.toLowerCase().includes(q) ||
              p.id.toLowerCase().includes(q) ||
              (p.subtitle?.toLowerCase().includes(q) ?? false),
          )
        : this.allPeople,
    );
  }
}
