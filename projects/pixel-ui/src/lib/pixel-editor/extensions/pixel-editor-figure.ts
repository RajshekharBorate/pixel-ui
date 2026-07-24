import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pixelEditorFigure: {
      /** Wrap the selected image in a figure with an empty caption, or insert a captioned figure. */
      addImageCaption: () => ReturnType;
      /** Lift image out of figure (drops caption). */
      removeImageCaption: () => ReturnType;
    };
  }
}

/**
 * Figure wrapper: image + editable figcaption.
 */
export const PixelEditorFigure = Node.create({
  name: 'figure',
  group: 'block',
  content: 'image caption?',
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'figure[data-type="pixel-figure"]' }, { tag: 'figure' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'pixel-figure',
        class: 'pixel-editor-figure',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      addImageCaption:
        () =>
        ({ state, chain, tr }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'figure') {
              if (node.childCount < 2) {
                const captionType = state.schema.nodes['caption'];
                if (!captionType) return false;
                const insertAt = $from.before(depth) + 1 + node.child(0).nodeSize;
                tr.insert(insertAt, captionType.create(null, state.schema.text('Caption')));
                return true;
              }
              return false;
            }
            if (node.type.name === 'image') {
              const pos = $from.before(depth);
              const imageNode = node;
              return chain()
                .deleteRange({ from: pos, to: pos + node.nodeSize })
                .insertContentAt(pos, {
                  type: 'figure',
                  content: [
                    imageNode.toJSON(),
                    { type: 'caption', content: [{ type: 'text', text: 'Caption' }] },
                  ],
                })
                .run();
            }
          }
          return false;
        },
      removeImageCaption:
        () =>
        ({ state, chain }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'figure') {
              const image = node.firstChild;
              if (!image || image.type.name !== 'image') return false;
              const pos = $from.before(depth);
              return chain()
                .deleteRange({ from: pos, to: pos + node.nodeSize })
                .insertContentAt(pos, image.toJSON())
                .run();
            }
          }
          return false;
        },
    };
  },
});

/** Editable caption under a figure image. */
export const PixelEditorCaption = Node.create({
  name: 'caption',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'figcaption' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figcaption',
      mergeAttributes(HTMLAttributes, { class: 'pixel-editor-figure__caption' }),
      0,
    ];
  },
});
