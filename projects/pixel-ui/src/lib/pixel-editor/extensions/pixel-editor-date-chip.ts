import { Node, mergeAttributes } from '@tiptap/core';
import { formatDisplayDate, parseLocalIsoDate } from '../../shared/datetime/pixel-date-utils';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dateChip: {
      /** Insert an inline date chip at the selection. */
      insertDateChip: (isoDate: string) => ReturnType;
    };
  }
}

function formatDisplay(iso: string): string {
  const d = parseLocalIsoDate(iso);
  if (!d) return iso;
  return formatDisplayDate(d);
}

/**
 * Inline date chip (Insert → Date / toolbar calendar).
 */
export const PixelEditorDateChip = Node.create({
  name: 'dateChip',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      value: {
        default: null as string | null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-date'),
        renderHTML: (attrs: { value?: string | null }) =>
          attrs.value ? { 'data-date': attrs.value } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="date-chip"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const value = (node.attrs['value'] as string | null) ?? '';
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'date-chip',
        class: 'pixel-editor-date-chip',
        contenteditable: 'false',
      }),
      formatDisplay(value),
    ];
  },

  addCommands() {
    return {
      insertDateChip:
        (isoDate: string) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { value: isoDate },
          }),
    };
  },
});
