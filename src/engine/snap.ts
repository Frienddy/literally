/**
 * Pixel-grid geometry (PRD-003 R03-3, FR-3, _docs/04 §2.3).
 *
 * Pure helpers that map between raw pointer pixels and integer `(col,row)` grid
 * *cells* — the squares the player fills with color. Storing drawings as cell
 * coordinates (not pixels) keeps them tiny, lossless, and resolution-independent.
 *
 * (Filename kept for import stability; the old node-snapping line math this once
 * held was removed when the canvas became a pixel-paint surface — ADR-015.)
 */
import type { GridNode, Point } from '../types/session';

export interface GridSpec {
  /** Number of cells across. */
  cols: number;
  /** Number of cells down. */
  rows: number;
  /** px size of one (square) cell. */
  cell: number;
  /** px offset of cell (0,0)'s top-left corner from the canvas top-left. */
  originX: number;
  originY: number;
}

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

/** Top-left pixel corner of a cell. */
export const cellOrigin = (n: GridNode, g: GridSpec): Point => ({
  x: g.originX + n.col * g.cell,
  y: g.originY + n.row * g.cell,
});

/** Pixel centre of a cell (handy for highlights / text). */
export const cellCenter = (n: GridNode, g: GridSpec): Point => ({
  x: g.originX + (n.col + 0.5) * g.cell,
  y: g.originY + (n.row + 0.5) * g.cell,
});

/**
 * The cell a raw pointer position falls in, or `null` when the pointer is outside
 * the cell field — painting ignores taps off the grid rather than clamping them to
 * an edge cell (which would smear paint along the border).
 */
export function pointToCell(p: Point, g: GridSpec): GridNode | null {
  const col = Math.floor((p.x - g.originX) / g.cell);
  const row = Math.floor((p.y - g.originY) / g.cell);
  if (col < 0 || col >= g.cols || row < 0 || row >= g.rows) return null;
  return { col, row };
}

/** Same as {@link pointToCell} but clamped to the nearest in-bounds cell. */
export function clampToCell(p: Point, g: GridSpec): GridNode {
  return {
    col: clamp(Math.floor((p.x - g.originX) / g.cell), 0, g.cols - 1),
    row: clamp(Math.floor((p.y - g.originY) / g.cell), 0, g.rows - 1),
  };
}
