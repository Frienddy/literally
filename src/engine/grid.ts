/**
 * Grid layout (PRD-006 R06-10, _docs/04 §2.3).
 *
 * Pure helper that turns an available pixel area + a logical grid size
 * (cols × rows of *cells*) into a centered {@link GridSpec} — the px `cell` size
 * and `origin` the paint math and renderer share. Kept framework-free alongside
 * the rest of the engine so the live canvas, the guidance overlay, and the dev
 * harness all derive identical geometry from one place (no drift).
 *
 * `cols`/`rows` count cells, so the drawn field spans exactly `cols × rows` cells.
 * The result is centered in `w × h` with `pad` px of breathing room on every edge,
 * and the cell is square (the smaller of the two fits).
 */
import type { GridSpec } from './snap';
import { config } from '../config';

export function computeGridSpec(
  w: number,
  h: number,
  cols: number,
  rows: number,
  // Default lives in config.ts so non-engineers can tune the cell spacing; callers
  // that need a different margin (small previews, export) pass their own.
  pad: number = config.grid.pad,
): GridSpec {
  const cell = Math.min((w - pad * 2) / cols, (h - pad * 2) / rows);
  return {
    cols,
    rows,
    cell,
    originX: (w - cell * cols) / 2,
    originY: (h - cell * rows) / 2,
  };
}
