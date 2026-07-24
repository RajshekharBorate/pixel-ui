import { Node, mergeAttributes } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import type { EditorState, Transaction } from '@tiptap/pm/state';

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

function findImagePos(state: EditorState, preferredPos?: number | null): number | null {
  if (preferredPos != null) {
    const node = state.doc.nodeAt(preferredPos);
    if (node?.type.name === 'image') return preferredPos;
  }
  const { selection } = state;
  if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
    return selection.from;
  }
  const { $from } = selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === 'image') {
      return $from.before(depth);
    }
    if (node.type.name === 'figure' && node.firstChild?.type.name === 'image') {
      return $from.before(depth) + 1;
    }
  }
  const nodeAfter = $from.nodeAfter;
  if (nodeAfter?.type.name === 'image') {
    return $from.pos;
  }
  // Last resort: scan near the selection for an image.
  let found: number | null = null;
  state.doc.nodesBetween(
    Math.max(0, selection.from - 2),
    Math.min(state.doc.content.size, selection.to + 2),
    (node, pos) => {
      if (node.type.name === 'image') {
        found = pos;
        return false;
      }
      return true;
    },
  );
  return found;
}

function wrapImageWithCaption(
  state: EditorState,
  imagePos: number,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const imageNode = state.doc.nodeAt(imagePos);
  if (!imageNode || imageNode.type.name !== 'image') return false;

  const figureType = state.schema.nodes['figure'];
  const captionType = state.schema.nodes['caption'];
  if (!figureType || !captionType) return false;

  const $pos = state.doc.resolve(imagePos);
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === 'figure') {
      if (node.childCount >= 2) return false;
      const insertAt = $pos.before(depth) + 1 + node.child(0).nodeSize;
      if (dispatch) {
        const tr = state.tr.insert(
          insertAt,
          captionType.create(null, state.schema.text('Caption')),
        );
        dispatch(tr);
      }
      return true;
    }
  }

  const caption = captionType.create(null, state.schema.text('Caption'));
  const imageCopy = state.schema.nodeFromJSON(imageNode.toJSON());
  const figureWithImage = figureType.create(null, [imageCopy, caption]);
  if (dispatch) {
    const tr = state.tr.replaceWith(imagePos, imagePos + imageNode.nodeSize, figureWithImage);
    dispatch(tr);
  }
  return true;
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
        ({ state, dispatch }) => {
          const imagePos = findImagePos(state);
          if (imagePos == null) return false;
          return wrapImageWithCaption(state, imagePos, dispatch);
        },
      removeImageCaption:
        () =>
        ({ state, chain }) => {
          const imagePos = findImagePos(state);
          if (imagePos == null) return false;
          const $pos = state.doc.resolve(imagePos);
          for (let depth = $pos.depth; depth > 0; depth--) {
            const node = $pos.node(depth);
            if (node.type.name === 'figure') {
              const image = node.firstChild;
              if (!image || image.type.name !== 'image') return false;
              const pos = $pos.before(depth);
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
    return [{ tag: 'figcaption' }, { tag: 'div[data-type="pixel-caption"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figcaption',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'pixel-caption',
        class: 'pixel-editor-figure__caption',
      }),
      0,
    ];
  },
});

/** Resolve image position for caption commands (exported for the engine). */
export function resolveImagePosForCaption(
  state: EditorState,
  preferredPos?: number | null,
): number | null {
  return findImagePos(state, preferredPos);
}

/** Wrap image at pos with a figure+caption (exported for the engine). */
export function applyImageCaptionWrap(
  state: EditorState,
  imagePos: number,
  dispatch?: (tr: Transaction) => void,
): boolean {
  return wrapImageWithCaption(state, imagePos, dispatch);
}
