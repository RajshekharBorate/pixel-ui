/**
 * Triggers a browser "Save As" for a Blob or string. Creates a transient object URL,
 * clicks a hidden anchor, then revokes the URL on the next tick.
 */
export function saveAs(
  data: Blob | string,
  fileName: string,
  mime = 'application/octet-stream',
): void {
  if (typeof document === 'undefined') {
    return;
  }
  const blob = typeof data === 'string' ? new Blob([data], { type: mime }) : data;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || 'download';
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
