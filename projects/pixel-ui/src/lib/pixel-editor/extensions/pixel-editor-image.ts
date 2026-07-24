import Image from '@tiptap/extension-image';
import type { NodeViewRendererProps } from '@tiptap/core';

export type PixelEditorImageAlign = 'start' | 'center' | 'end';
export type PixelEditorImageFloat = 'none' | 'start' | 'end';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pixelEditorImage: {
      setImageAttrs: (attrs: {
        align?: PixelEditorImageAlign | null;
        displayWidth?: string | null;
        float?: PixelEditorImageFloat | null;
        alt?: string | null;
        src?: string | null;
      }) => ReturnType;
      removeImage: () => ReturnType;
    };
  }
}

function syncWrapAttrs(
  wrap: HTMLElement,
  attrs: {
    align?: string | null;
    displayWidth?: string | null;
    float?: string | null;
  },
): void {
  wrap.dataset['align'] = attrs.align || 'start';
  wrap.dataset['float'] = attrs.float || 'none';
  if (attrs.displayWidth) {
    wrap.style.inlineSize = attrs.displayWidth;
    wrap.style.maxInlineSize = '100%';
  } else {
    wrap.style.inlineSize = '';
    wrap.style.maxInlineSize = '100%';
  }
}

function createImageNodeView(props: NodeViewRendererProps) {
  const { node } = props;
  const wrap = document.createElement('div');
  wrap.className = 'pixel-editor-image';
  wrap.contentEditable = 'false';
  wrap.dataset['type'] = 'image';

  const img = document.createElement('img');
  img.src = String(node.attrs['src'] ?? '');
  img.alt = String(node.attrs['alt'] ?? '');
  img.draggable = false;

  syncWrapAttrs(wrap, node.attrs as { align?: string; displayWidth?: string; float?: string });
  wrap.append(img);

  return {
    dom: wrap,
    selectNode: () => {
      wrap.classList.add('pixel-editor-image--selected');
    },
    deselectNode: () => {
      wrap.classList.remove('pixel-editor-image--selected');
    },
    update: (updated: typeof node) => {
      if (updated.type.name !== 'image') return false;
      img.src = String(updated.attrs['src'] ?? '');
      img.alt = String(updated.attrs['alt'] ?? '');
      syncWrapAttrs(wrap, updated.attrs as { align?: string; displayWidth?: string; float?: string });
      return true;
    },
  };
}

/**
 * Block image with align / width / float attrs.
 * Width is controlled via the floating image toolbar (no corner resize handle).
 */
export const PixelEditorImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'start' as PixelEditorImageAlign,
        parseHTML: (el: HTMLElement) =>
          (el.closest('[data-align]')?.getAttribute('data-align') as PixelEditorImageAlign) ||
          (el.getAttribute('data-align') as PixelEditorImageAlign) ||
          'start',
        renderHTML: (attrs: { align?: string }) =>
          attrs.align ? { 'data-align': attrs.align } : {},
      },
      displayWidth: {
        default: null as string | null,
        parseHTML: (el: HTMLElement) => {
          const wrap = el.closest('.pixel-editor-image') as HTMLElement | null;
          return wrap?.style.inlineSize || el.getAttribute('data-display-width') || null;
        },
        renderHTML: (attrs: { displayWidth?: string | null }) =>
          attrs.displayWidth ? { 'data-display-width': attrs.displayWidth } : {},
      },
      float: {
        default: 'none' as PixelEditorImageFloat,
        parseHTML: (el: HTMLElement) =>
          (el.closest('[data-float]')?.getAttribute('data-float') as PixelEditorImageFloat) ||
          (el.getAttribute('data-float') as PixelEditorImageFloat) ||
          'none',
        renderHTML: (attrs: { float?: string }) =>
          attrs.float && attrs.float !== 'none' ? { 'data-float': attrs.float } : {},
      },
    };
  },

  addNodeView() {
    return (props) => createImageNodeView(props);
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageAttrs:
        (attrs) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, attrs),
      removeImage:
        () =>
        ({ commands }) =>
          commands.deleteSelection(),
    };
  },
}).configure({
  inline: false,
  allowBase64: true,
  HTMLAttributes: { class: 'pixel-editor-image__img' },
});
