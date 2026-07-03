/** Transparent 1×1 gif — replaces the browser's default drag ghost. */
const EMPTY_DRAG_IMAGE = (() => {
  const image = new Image();
  image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  return image;
})();

/** Rows cloned into the floating column (caps the preview height for tall pages). */
const MAX_PREVIEW_ROWS = 14;

export interface PixelDataGridDragPreviewSession {
  cleanup(): void;
}

function cssVar(host: HTMLElement, name: string, fallback: string): string {
  const value = getComputedStyle(host).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Design tokens the cell / header styles reference via `var(...)`. They live on the grid's
 * `:host` / container, so they must be copied onto the body-appended preview for the cloned cells
 * to render with the right padding, borders, colours, and fonts.
 */
const PREVIEW_TOKENS = [
  '--pixel-data-grid-bg',
  '--pixel-data-grid-header-bg',
  '--pixel-data-grid-row-hover-bg',
  '--pixel-data-grid-row-stripe-bg',
  '--pixel-data-grid-border',
  '--pixel-data-grid-text',
  '--pixel-data-grid-header-text',
  '--pixel-data-grid-muted',
  '--pixel-data-grid-radius',
  '--pixel-data-grid-transition',
  '--pixel-data-grid-cell-padding-block',
  '--pixel-data-grid-cell-padding-inline',
  '--pixel-data-grid-font-size',
  '--pixel-data-grid-group-bg',
  '--pixel-data-grid-foot-bg',
  '--pixel-sys-primary',
  '--pixel-sys-on-primary',
  '--pixel-sys-focus-ring',
  '--pixel-sys-on-surface',
  '--pixel-sys-label-font-family',
  '--pixel-sys-font-family',
  '--pixel-sys-label-xs-size',
  '--pixel-sys-label-sm-size',
  '--pixel-sys-label-sm-weight',
  '--pixel-sys-label-sm-line-height',
  '--pixel-sys-label-md-size',
] as const;

/**
 * Shows the entire column being reordered as a floating strip that follows the pointer — the
 * header cell stacked over the visible body cells for that column — mirroring the query-builder's
 * "whole node lifts" effect. The strip is appended to `document.body`; cloned cells keep their
 * scoped padding/border/alignment (Angular's emulated-encapsulation attribute selectors are global),
 * and font / colour / surface tokens are read off the grid host and applied to the container so the
 * relocated clone renders correctly.
 */
export function startColumnDragPreview(
  event: DragEvent,
  headerCell: HTMLElement,
  gridHost: HTMLElement,
): PixelDataGridDragPreviewSession | null {
  if (!event.dataTransfer) {
    return null;
  }
  event.dataTransfer.setDragImage(EMPTY_DRAG_IMAGE, 0, 0);

  const headerRow = headerCell.parentElement;
  if (!headerRow) {
    return null;
  }
  const cellIndex = Array.prototype.indexOf.call(headerRow.children, headerCell);
  const rect = headerCell.getBoundingClientRect();

  // The density padding tokens live on the container; base tokens are inherited from the host.
  const tokenSource = gridHost.querySelector<HTMLElement>('.pixel-data-grid__container') ?? gridHost;
  const hostStyle = getComputedStyle(gridHost);
  // Body cells inherit their font-size from the `<table>` (not the cell), so the preview container
  // must match the table's size — otherwise the relocated clones render at the host's larger size.
  const tableEl = gridHost.querySelector<HTMLElement>('.pixel-data-grid__table');
  const baseFontSize = tableEl ? getComputedStyle(tableEl).fontSize : hostStyle.fontSize;
  const surface = cssVar(tokenSource, '--pixel-data-grid-bg', '#ffffff');
  const headerBg = cssVar(tokenSource, '--pixel-data-grid-header-bg', surface);
  const border = cssVar(tokenSource, '--pixel-data-grid-border', 'rgba(0, 0, 0, 0.15)');
  const primary = cssVar(tokenSource, '--pixel-sys-primary', '#0b57d0');

  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');

  const cloneCell = (cell: HTMLElement, background: string): HTMLElement => {
    const clone = cell.cloneNode(true) as HTMLElement;
    // Keep the exact header chrome (sort / filter / kebab / drag icons); only drop the hidden menu
    // panels and the absolutely-positioned resize sliver, and flatten sticky positioning.
    clone
      .querySelectorAll('pixel-menu, .pixel-data-grid__resize-handle')
      .forEach((node) => node.remove());
    Object.assign(clone.style, {
      display: 'block',
      position: 'static',
      inset: 'auto',
      inlineSize: '100%',
      maxInlineSize: '100%',
      boxSizing: 'border-box',
      background,
    } as Partial<CSSStyleDeclaration>);
    return clone;
  };

  container.appendChild(cloneCell(headerCell, headerBg));
  const bodyRows = Array.from(
    gridHost.querySelectorAll<HTMLElement>(
      'tbody .pixel-data-grid__row:not(.pixel-data-grid__row--empty)',
    ),
  ).slice(0, MAX_PREVIEW_ROWS);
  for (const row of bodyRows) {
    const cell = row.children[cellIndex] as HTMLElement | undefined;
    if (cell) {
      container.appendChild(cloneCell(cell, surface));
    }
  }

  const offsetX = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
  const offsetY = Math.max(0, event.clientY - rect.top);

  Object.assign(container.style, {
    position: 'fixed',
    insetInlineStart: `${event.clientX - offsetX}px`,
    insetBlockStart: `${event.clientY - offsetY}px`,
    inlineSize: `${rect.width}px`,
    maxBlockSize: '62vh',
    overflow: 'hidden',
    margin: '0',
    zIndex: '2147483647',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
    border: `1px solid color-mix(in srgb, ${primary} 45%, ${border})`,
    background: surface,
    color: hostStyle.color,
    fontFamily: hostStyle.fontFamily,
    fontSize: baseFontSize,
    boxShadow: `0 18px 44px color-mix(in srgb, ${hostStyle.color} 26%, transparent)`,
    opacity: '0.97',
  } as Partial<CSSStyleDeclaration>);

  // Copy the grid's design tokens so the cloned cells' `var(...)` references resolve off-host.
  const tokenStyle = getComputedStyle(tokenSource);
  for (const token of PREVIEW_TOKENS) {
    const value = tokenStyle.getPropertyValue(token);
    if (value) {
      container.style.setProperty(token, value);
    }
  }

  document.body.appendChild(container);

  const onDragOver = (dragEvent: DragEvent): void => {
    container.style.insetInlineStart = `${dragEvent.clientX - offsetX}px`;
    container.style.insetBlockStart = `${dragEvent.clientY - offsetY}px`;
  };
  document.addEventListener('dragover', onDragOver, { passive: true });

  return {
    cleanup(): void {
      document.removeEventListener('dragover', onDragOver);
      container.remove();
    },
  };
}
