/**
 * Mode 2 snap-to-grid math (PRD-003 R03-3, FR-3, _docs/04 §2.3).
 *
 * Pure helpers that map between raw pointer pixels and integer `(col,row)` grid
 * nodes. Storing grid drawings as nodes (not pixels) makes them tiny, lossless,
 * and resolution-independent.
 */
import type { GridNode, Point } from '../types/session';

export interface GridSpec {
  cols: number;
  rows: number;
  /** px size of one cell (square). */
  cell: number;
  /** px offset of node (0,0) from canvas top-left. */
  originX: number;
  originY: number;
}

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

/** Pixel center of a grid node. */
export const nodeToPixel = (n: GridNode, g: GridSpec): Point => ({
  x: g.originX + n.col * g.cell,
  y: g.originY + n.row * g.cell,
});

/** Nearest grid node to a raw pointer position, clamped to grid bounds. */
export function snapToNode(p: Point, g: GridSpec): GridNode {
  const col = clamp(Math.round((p.x - g.originX) / g.cell), 0, g.cols - 1);
  const row = clamp(Math.round((p.y - g.originY) / g.cell), 0, g.rows - 1);
  return { col, row };
}

/**
 * True only when the pointer is within `tolerance` px of its snapped node — used
 * to fire the satisfying haptic "click" exactly on snap, not on every move.
 */
export function isWithinSnap(
  p: Point,
  g: GridSpec,
  tolerance = g.cell * 0.4,
): boolean {
  const n = snapToNode(p, g);
  const px = nodeToPixel(n, g);
  return Math.hypot(p.x - px.x, p.y - px.y) <= tolerance;
}
