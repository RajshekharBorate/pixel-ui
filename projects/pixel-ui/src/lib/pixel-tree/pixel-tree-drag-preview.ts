function emptyDragImage(): HTMLImageElement | null {
  if (typeof Image === 'undefined') {
    return null;
  }
  const image = new Image();
  image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  return image;
}

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
  'padding',
  'paddingBlock',
  'paddingInline',
  'margin',
  'font',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'minWidth',
  'minHeight',
  'width',
  'height',
  'overflow',
  'opacity',
  'outline',
  'outlineOffset',
  'boxSizing',
  'alignSelf',
  'flex',
  'whiteSpace',
  'visibility',
] as const;

export interface PixelTreeDragPreviewSession {
  cleanup(): void;
}

/**
 * Floating clone of the dragged tree row that follows the pointer — same technique as
 * `pixel-query-builder-drag-preview` (mirror computed styles + drop-shadow lift).
 */
export function startTreeRowDragPreview(
  event: DragEvent,
  rowElement: HTMLElement,
): PixelTreeDragPreviewSession | null {
  if (!event.dataTransfer) {
    return null;
  }

  const ghost = emptyDragImage();
  if (ghost) {
    event.dataTransfer.setDragImage(ghost, 0, 0);
  }

  const sourceRect = rowElement.getBoundingClientRect();
  const offsetX = Math.max(0, event.clientX - sourceRect.left);
  const offsetY = Math.max(0, event.clientY - sourceRect.top);

  const preview = rowElement.cloneNode(true) as HTMLElement;
  preview.classList.add('pixel-tree__drag-preview');
  preview.setAttribute('aria-hidden', 'true');
  preview.removeAttribute('id');
  preview.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  mirrorComputedStyles(rowElement, preview);

  Object.assign(preview.style, {
    position: 'fixed',
    insetInlineStart: `${event.clientX - offsetX}px`,
    insetBlockStart: `${event.clientY - offsetY}px`,
    inlineSize: `${sourceRect.width}px`,
    margin: '0',
    pointerEvents: 'none',
    zIndex: '2147483647',
    opacity: '0.97',
    boxSizing: 'border-box',
    transform: 'scale(1)',
    filter: 'drop-shadow(0 18px 40px rgba(0, 0, 0, 0.18))',
    cursor: 'grabbing',
  } as Partial<CSSStyleDeclaration>);

  document.body.appendChild(preview);

  const onDragOver = (dragEvent: DragEvent): void => {
    preview.style.insetInlineStart = `${dragEvent.clientX - offsetX}px`;
    preview.style.insetBlockStart = `${dragEvent.clientY - offsetY}px`;
  };

  document.addEventListener('dragover', onDragOver, { passive: true });

  return {
    cleanup(): void {
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
