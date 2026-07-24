import { Node, mergeAttributes } from '@tiptap/core';

export type PixelEditorPanelVariant = 'info' | 'note' | 'success' | 'warning' | 'error';

const PANEL_ICONS: Record<PixelEditorPanelVariant, string> = {
  info: 'info',
  note: 'sticky_note_2',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    panel: {
      /**
       * Wrap the selection in a panel (or insert an empty panel).
       */
      setPanel: (variant?: PixelEditorPanelVariant) => ReturnType;
      /**
       * Toggle a panel wrapper around the selection.
       */
      togglePanel: (variant?: PixelEditorPanelVariant) => ReturnType;
      /**
       * Update the variant of the panel at the selection.
       */
      updatePanelVariant: (variant: PixelEditorPanelVariant) => ReturnType;
    };
  }
}

/**
 * Callout / info panel block — matches the Jira-like UX "Panel" insert.
 */
export const PixelEditorPanel = Node.create({
  name: 'panel',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      variant: {
        default: 'info' satisfies PixelEditorPanelVariant,
        parseHTML: (element: HTMLElement) =>
          (element.getAttribute('data-variant') as PixelEditorPanelVariant | null) ?? 'info',
        renderHTML: (attributes: { variant?: PixelEditorPanelVariant }) => ({
          'data-variant': attributes.variant ?? 'info',
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="panel"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const variant = (node.attrs['variant'] as PixelEditorPanelVariant) || 'info';
    const icon = PANEL_ICONS[variant] ?? PANEL_ICONS.info;
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'panel',
        class: `pixel-editor-panel pixel-editor-panel--${variant}`,
      }),
      [
        'span',
        {
          class: 'material-symbols-outlined pixel-editor-panel__icon',
          'aria-hidden': 'true',
        },
        icon,
      ],
      ['div', { class: 'pixel-editor-panel__body' }, 0],
    ];
  },

  addCommands() {
    return {
      setPanel:
        (variant: PixelEditorPanelVariant = 'info') =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { variant },
            content: [{ type: 'paragraph' }],
          }),
      togglePanel:
        (variant: PixelEditorPanelVariant = 'info') =>
        ({ commands }) =>
          commands.toggleWrap(this.name, { variant }),
      updatePanelVariant:
        (variant: PixelEditorPanelVariant) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { variant }),
    };
  },
});
