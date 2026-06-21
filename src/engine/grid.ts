/**
 * Grid layout (PRD-006 R06-10, _docs/04 §2.3).
 *
 * Pure helper that turns an available pixel area + a logical grid size
 * (cols × rows of *nodes*) into a centered {@link GridSpec} — the px `cell` size
 * and `origin` the snap math and renderer share. Kept framework-free alongside
 * the rest of the engine so the live canvas, the guidance overlay, and the dev
 * harness all derive identical geometry from one place (no drift).
 *
 * `cols`/`rows` count nodes, so the drawn grid spans `(n - 1)` cells. The result
 * is centered in `w × h` with `pad` px of breathing room on every edge.
 */
import type { GridSpec } from './snap';

export function computeGridSpec(
  w: number,
  h: number,
  cols: number,
  rows: number,
  pad = 24,
): GridSpec {
  const cell = Math.min((w - pad * 2) / (cols - 1), (h - pad * 2) / (rows - 1));
  const span = (n: number) => cell * (n - 1);
  return {
    cols,
    rows,
    cell,
    originX: (w - span(cols)) / 2,
    originY: (h - span(rows)) / 2,
  };
}
