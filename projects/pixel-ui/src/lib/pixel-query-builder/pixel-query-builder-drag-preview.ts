/** Transparent 1×1 gif — hides the browser's default drag handle bitmap. */
const EMPTY_DRAG_IMAGE = (() => {
  const image = new Image();
  image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  return image;
})();

const PREVIEW_STYLE_PROPS = [
  'background',
  'backgroundColor',
  'backgroundImage',
  'border',
  'borderRadius',
  'borderBlockStart',
  'borderBlockEnd',
  'borderInlineStart',
  'borderInlineEnd',
  'boxShadow',
  'color',
  'display',
  'flexDirection',
  'alignItems',
  'justifyContent',
  'gap',
  'gridTemplateColumns',
  'gridColumn',
  'gridRow',
  'padding',
  'paddingBlock',
  'paddingInline',
  'margin',
  'font',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'textAlign',
  'minWidth',
  'maxWidth',
  'minHeight',
  'width',
  'height',
  'overflow',
  'opacity',
  'outline',
  'outlineOffset',
  'boxSizing',
  'alignSelf',
  'justifySelf',
  'flex',
  'whiteSpace',
] as const;

export interface PixelQueryDragPreviewSession {
  cleanup(): void;
}

/**
 * Shows a floating clone of the dragged node that follows the pointer.
 * More reliable than `setDragImage` for large nested ruleset cards in Angular.
 */
export function startQueryDragPreview(
  event: DragEvent,
  sourceNode: HTMLElement,
): PixelQueryDragPreviewSession | null {
  if (!event.dataTransfer) {
    return null;
  }

  event.dataTransfer.setDragImage(EMPTY_DRAG_IMAGE, 0, 0);

  const sourceRect = sourceNode.getBoundingClientRect();
  const offsetX = Math.max(0, event.clientX - sourceRect.left);
  const offsetY = Math.max(0, event.clientY - sourceRect.top);

  const preview = sourceNode.cloneNode(true) as HTMLElement;
  preview.classList.add('pixel-query-builder__drag-preview');
  preview.setAttribute('aria-hidden', 'true');
  mirrorComputedStyles(sourceNode, preview);

  const sourceContent = sourceNode.querySelector(':scope > .pixel-query-group__node-content');
  const previewContent = preview.querySelector(':scope > .pixel-query-group__node-content');
  if (sourceContent instanceof HTMLElement && previewContent instanceof HTMLElement) {
    previewContent.style.width = `${sourceContent.getBoundingClientRect().width}px`;
    previewContent.style.minWidth = `${sourceContent.getBoundingClientRect().width}px`;
  }

  const maxPreviewHeight = 440;
  if (sourceNode.scrollHeight > maxPreviewHeight) {
    preview.style.maxHeight = `${maxPreviewHeight}px`;
    preview.style.overflow = 'hidden';
  }

  Object.assign(preview.style, {
    position: 'fixed',
    left: `${event.clientX - offsetX}px`,
    top: `${event.clientY - offsetY}px`,
    width: `${sourceRect.width}px`,
    margin: '0',
    pointerEvents: 'none',
    zIndex: '2147483647',
    opacity: '0.97',
    boxSizing: 'border-box',
    transform: 'scale(1)',
    filter: 'drop-shadow(0 18px 40px rgba(0, 0, 0, 0.18))',
    cursor: 'grabbing',
  });

  document.body.appendChild(preview);

  const onDragOver = (dragEvent: DragEvent): void => {
    preview.style.left = `${dragEvent.clientX - offsetX}px`;
    preview.style.top = `${dragEvent.clientY - offsetY}px`;
  };

  document.addEventListener('dragover', onDragOver, { passive: true });

  return {
    cleanup() {
      document.removeEventListener('dragover', onDragOver);
      preview.remove();
    },
  };
}

function mirrorComputedStyles(source: Element, target: Element): void {
  if (!(source instanceof HTMLElement) || !(target instanceof HTMLElement)) {
    return;
  }

  const computed = getComputedStyle(source);
  for (const prop of PREVIEW_STYLE_PROPS) {
    const value = computed[prop];
    if (value) {
      target.style[prop] = value;
    }
  }

  const sourceChildren = source.children;
  const targetChildren = target.children;
  const childCount = Math.min(sourceChildren.length, targetChildren.length);
  for (let index = 0; index < childCount; index += 1) {
    mirrorComputedStyles(sourceChildren[index]!, targetChildren[index]!);
  }
}
