/**
 * Mode 2 — the literal, one-at-a-time step sequence for the canonical subject
 * (PRD-006 R06-9, _docs/01 §4.2). Content is **data, not JSX** (ADR-007): each
 * step pairs a player-facing instruction with the single grid segment it draws,
 * so the same array drives the step cards, the on-grid guidance ghost, and the
 * hidden target Reflection reveals (ADR-010).
 *
 * Reconciliation vs the _docs/01 §4.2 example (no ADR change): the doc sketched
 * the door/window as "boxes" inside a single step. Here **every step is exactly
 * one segment** so `drawStepGuidance` can ghost precisely one target move per
 * card and the "Step X of N" progress maps 1:1 to drawing actions. The door is
 * therefore an inverted-U doorway (3 single-segment steps); the optional window
 * is deferred to PRD-009's task expansion. Net: a fully closed, recognizable
 * house in 9 literal steps (the doc's "~8") on the shared 8×10 grid.
 *
 * Coordinates are `(col,row)` nodes on an 8-col × 10-row grid (cols 0–7, rows
 * 0–9; `config.grid`). The house occupies a 4×4 wall square with a peaked roof
 * and a centered doorway, comfortably inside the grid bounds.
 */
import type { GridDrawing, GridSegment } from '../types/session';
import { config } from '../config';

export interface Mode2Step {
  /** The literal, unambiguous instruction shown on this step's card. */
  text: string;
  /** The single grid segment the player draws to satisfy this step. */
  segment: GridSegment;
}

const seg = (
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number,
): GridSegment => ({
  from: { col: fromCol, row: fromRow },
  to: { col: toCol, row: toRow },
});

/**
 * The house, top-left wall corner at (2,4):
 *  - walls: a 4×4 square (steps 1–4, closed loop)
 *  - roof: a triangle to the peak at (4,2) (steps 5–6)
 *  - door: a centered inverted-U doorway on the floor (steps 7–9)
 */
export const houseSteps: Mode2Step[] = [
  { text: 'From the dot, go ⬇️ down 4 squares.', segment: seg(2, 4, 2, 8) },
  { text: 'Go ➡️ right 4 squares.', segment: seg(2, 8, 6, 8) },
  { text: 'Go ⬆️ up 4 squares.', segment: seg(6, 8, 6, 4) },
  {
    text: 'Go ⬅️ left 4 squares. The walls are done.',
    segment: seg(6, 4, 2, 4),
  },
  {
    text: 'From the top-left corner, go ↗️ up-right 2 squares to the peak.',
    segment: seg(2, 4, 4, 2),
  },
  {
    text: 'Go ↘️ down-right 2 squares to the top-right corner. The roof is done.',
    segment: seg(4, 2, 6, 4),
  },
  {
    text: 'Door: from the floor, go ⬆️ up 2 squares.',
    segment: seg(3, 8, 3, 6),
  },
  { text: 'Door: go ➡️ right 2 squares.', segment: seg(3, 6, 5, 6) },
  {
    text: 'Door: go ⬇️ down 2 squares back to the floor. All done!',
    segment: seg(5, 6, 5, 8),
  },
];

/** The intended result — the ordered step segments on the shared grid. */
export const houseTarget: GridDrawing = {
  kind: 'grid',
  segments: houseSteps.map((s) => s.segment),
  grid: { cols: config.grid.cols, rows: config.grid.rows },
};
