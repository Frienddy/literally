/**
 * Mode 2 — the literal, one-at-a-time step sequences for the **task pool**
 * (PRD-006 R06-9, PRD-009 R09-6/R09-7, FR-20, _docs/01 §4.2). Content is **data,
 * not JSX** (ADR-007): each step pairs a player-facing instruction with the single
 * grid segment it draws, so the same array drives the step cards, the on-grid
 * guidance ghost, and the hidden target Reflection reveals (ADR-010).
 *
 * Reconciliation vs the _docs/01 §4.2 example (no ADR change): the doc sketched
 * the door/window as "boxes" inside a single step. Here **every step is exactly
 * one segment** so `drawStepGuidance` can ghost precisely one target move per card
 * and the "Step X of N" progress maps 1:1 to drawing actions.
 *
 * v1 authors three subjects (PRD-009 closes the pool, `_debt/005`): **house** (9
 * steps — walls → peaked roof → inverted-U door), **cat** (8 — face square → two
 * triangular ears), **flower** (6 — stem → diamond blossom → leaf). Both modes of a
 * session share one `task_id` (picked in the store), and each subject's vague Mode-1
 * ask lives in `content/mode1.instructions.ts`.
 *
 * Coordinates are `(col,row)` nodes on an 8-col × 10-row grid (cols 0–7, rows
 * 0–9; `config.grid`), all comfortably inside the grid bounds.
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

/**
 * The cat (PRD-009 R09-7, FR-20), a 4×4 face square (steps 1–4, closed loop) with
 * two triangular ears built on its top edge (steps 5–8). Cols 2–6, rows 1–7.
 * Non-45° ear moves are stated as explicit (right N, up/down N) offsets so each
 * card stays literal and unambiguous; guidance ghosts the exact move.
 */
export const catSteps: Mode2Step[] = [
  { text: 'From the dot, go ⬇️ down 4 squares.', segment: seg(2, 3, 2, 7) },
  { text: 'Go ➡️ right 4 squares.', segment: seg(2, 7, 6, 7) },
  { text: 'Go ⬆️ up 4 squares.', segment: seg(6, 7, 6, 3) },
  {
    text: 'Go ⬅️ left 4 squares. The face is done.',
    segment: seg(6, 3, 2, 3),
  },
  {
    text: 'From the top-left corner, go up-right (right 1, up 2) to the ear tip.',
    segment: seg(2, 3, 3, 1),
  },
  {
    text: 'Go down-right (right 1, down 2) to the middle of the top.',
    segment: seg(3, 1, 4, 3),
  },
  {
    text: 'Go up-right (right 1, up 2) to the other ear tip.',
    segment: seg(4, 3, 5, 1),
  },
  {
    text: 'Go down-right (right 1, down 2) to the top-right corner. All done!',
    segment: seg(5, 1, 6, 3),
  },
];

/**
 * The flower (PRD-009 R09-7, FR-20): a stem (step 1), a four-petal diamond blossom
 * around (4,4) (steps 2–5, closed loop), and a leaf off the stem (step 6). Cols
 * 2–6, rows 2–9. The blossom moves are clean 45° diagonals.
 */
export const flowerSteps: Mode2Step[] = [
  {
    text: 'From the dot, go ⬆️ up 3 squares. That’s the stem.',
    segment: seg(4, 9, 4, 6),
  },
  {
    text: 'From the top of the stem, go up-left (left 2, up 2) to a petal point.',
    segment: seg(4, 6, 2, 4),
  },
  {
    text: 'Go up-right (right 2, up 2) to the top petal point.',
    segment: seg(2, 4, 4, 2),
  },
  {
    text: 'Go down-right (right 2, down 2) to the next petal point.',
    segment: seg(4, 2, 6, 4),
  },
  {
    text: 'Go down-left (left 2, down 2) back to the stem. The flower is done.',
    segment: seg(6, 4, 4, 6),
  },
  {
    text: 'From partway up the stem, go ➡️ right 2 squares. That’s a leaf.',
    segment: seg(4, 7, 6, 7),
  },
];

/** Each subject's intended result — the ordered step segments on the shared grid. */
const targetOf = (steps: Mode2Step[]): GridDrawing => ({
  kind: 'grid',
  segments: steps.map((s) => s.segment),
  grid: { cols: config.grid.cols, rows: config.grid.rows },
});

export const houseTarget: GridDrawing = targetOf(houseSteps);
export const catTarget: GridDrawing = targetOf(catSteps);
export const flowerTarget: GridDrawing = targetOf(flowerSteps);
