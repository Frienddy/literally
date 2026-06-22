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
 * Coordinates are `(col,row)` nodes on a 22-col × 28-row grid (cols 0–21, rows
 * 0–27; `config.grid`), all comfortably inside the grid bounds. These were scaled
 * ×3 from the original 8×10 layout when the dot grid was made finer, so the
 * drawings render in the same place at the same size — just on more dots. Every
 * segment now spans a multiple of 3 cells, and the "N squares" counts in each
 * step's text match the new cell counts.
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
 * The house, top-left wall corner at (6,12):
 *  - walls: a 12×12-cell square (steps 1–4, closed loop)
 *  - roof: a triangle to the peak at (12,6) (steps 5–6)
 *  - door: a centered inverted-U doorway on the floor (steps 7–9)
 */
export const houseSteps: Mode2Step[] = [
  { text: 'From the dot, go ⬇️ down 12 squares.', segment: seg(6, 12, 6, 24) },
  { text: 'Go ➡️ right 12 squares.', segment: seg(6, 24, 18, 24) },
  { text: 'Go ⬆️ up 12 squares.', segment: seg(18, 24, 18, 12) },
  {
    text: 'Go ⬅️ left 12 squares. The walls are done.',
    segment: seg(18, 12, 6, 12),
  },
  {
    text: 'From the top-left corner, go ↗️ up-right 6 squares to the peak.',
    segment: seg(6, 12, 12, 6),
  },
  {
    text: 'Go ↘️ down-right 6 squares to the top-right corner. The roof is done.',
    segment: seg(12, 6, 18, 12),
  },
  {
    text: 'Door: from the floor, go ⬆️ up 6 squares.',
    segment: seg(9, 24, 9, 18),
  },
  { text: 'Door: go ➡️ right 6 squares.', segment: seg(9, 18, 15, 18) },
  {
    text: 'Door: go ⬇️ down 6 squares back to the floor. All done!',
    segment: seg(15, 18, 15, 24),
  },
];

/**
 * The cat (PRD-009 R09-7, FR-20), a 12×12-cell face square (steps 1–4, closed
 * loop) with two triangular ears built on its top edge (steps 5–8). Cols 6–18,
 * rows 3–21. Non-45° ear moves are stated as explicit (right N, up/down N) offsets
 * so each card stays literal and unambiguous; guidance ghosts the exact move.
 */
export const catSteps: Mode2Step[] = [
  { text: 'From the dot, go ⬇️ down 12 squares.', segment: seg(6, 9, 6, 21) },
  { text: 'Go ➡️ right 12 squares.', segment: seg(6, 21, 18, 21) },
  { text: 'Go ⬆️ up 12 squares.', segment: seg(18, 21, 18, 9) },
  {
    text: 'Go ⬅️ left 12 squares. The face is done.',
    segment: seg(18, 9, 6, 9),
  },
  {
    text: 'From the top-left corner, go up-right (right 3, up 6) to the ear tip.',
    segment: seg(6, 9, 9, 3),
  },
  {
    text: 'Go down-right (right 3, down 6) to the middle of the top.',
    segment: seg(9, 3, 12, 9),
  },
  {
    text: 'Go up-right (right 3, up 6) to the other ear tip.',
    segment: seg(12, 9, 15, 3),
  },
  {
    text: 'Go down-right (right 3, down 6) to the top-right corner. All done!',
    segment: seg(15, 3, 18, 9),
  },
];

/**
 * The flower (PRD-009 R09-7, FR-20): a stem (step 1), a four-petal diamond blossom
 * around (12,12) (steps 2–5, closed loop), and a leaf off the stem (step 6). Cols
 * 6–18, rows 6–27. The blossom moves are clean 45° diagonals.
 */
export const flowerSteps: Mode2Step[] = [
  {
    text: 'From the dot, go ⬆️ up 9 squares. That’s the stem.',
    segment: seg(12, 27, 12, 18),
  },
  {
    text: 'From the top of the stem, go up-left (left 6, up 6) to a petal point.',
    segment: seg(12, 18, 6, 12),
  },
  {
    text: 'Go up-right (right 6, up 6) to the top petal point.',
    segment: seg(6, 12, 12, 6),
  },
  {
    text: 'Go down-right (right 6, down 6) to the next petal point.',
    segment: seg(12, 6, 18, 12),
  },
  {
    text: 'Go down-left (left 6, down 6) back to the stem. The flower is done.',
    segment: seg(18, 12, 12, 18),
  },
  {
    text: 'From partway up the stem, go ➡️ right 6 squares. That’s a leaf.',
    segment: seg(12, 21, 18, 21),
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
