/**
 * Checks whether a file matches an `accept` string (same syntax as `<input accept>`).
 * Supports MIME wildcards (`image/*`), exact MIME (`application/pdf`), and extensions (`.pdf`).
 */
export function isFileAccepted(file: File, accept: string): boolean {
  if (!accept.trim()) return true;
  const tokens = accept.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const mime = file.type.toLowerCase();
  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();

  return tokens.some((token) => {
    if (token.endsWith('/*')) return mime.startsWith(token.slice(0, -1));
    if (token.startsWith('.')) return ext === token;
    return mime === token;
  });
}
