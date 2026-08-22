/**
 * Shared helpers for data-grid docs examples — long labels stress ellipsis / overflow.
 */

const LONG_TAIL =
  ' — extended notes for layout stress: cross-region orchestration review with stakeholders, compliance checkpoints, and follow-up actions tracked across the quarter';

/**
 * Returns `base` unchanged, or appends a long suffix on every `every`-th row (0-based index).
 * Use on primary text columns (name, customer, title, subject, …).
 */
export function withLongDemoLabel(base: string, index: number, every = 3): string {
  return index % every === 0 ? `${base}${LONG_TAIL}` : base;
}
