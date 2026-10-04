/** Shared shapes for DESIGN.md and orchestration.html. */

export const COL = [24, 250, 476, 702];
export const ROW = [20, 160, 310, 460, 610];

export function n(id, title, text, pixel, col, row) {
  return { id, title, text, pixel: pixel ?? null, x: COL[col], y: ROW[row] };
}

/** edges: ["from>to", ...] */
export function st(on, edges, text, blocked, label) {
  const step = {
    on,
    edges: (edges || []).map((pair) => pair.split('>')),
    text,
  };
  if (blocked?.length) step.blocked = blocked;
  if (label) step.label = label;
  return step;
}

export function feature(spec) {
  return spec;
}
