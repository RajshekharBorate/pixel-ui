/**
 * Replaces `{key}` placeholders in a label template with stringified values.
 * Unknown placeholders are left unchanged.
 */
export function formatPixelLabel(
  template: string,
  vars: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}
