/**
 * Mode 2 — the literal, one-at-a-time step sequences for the **task pool** (FR-20,
 * formerly _docs/01 §4.2). Content is **data, not JSX** (ADR-007): each step pairs a
 * player-facing instruction with the single grid segment it draws, so the same array
 * drives the step cards, the on-grid guidance ghost, and the hidden target the
 * Reflection reveals (ADR-010).
 *
 * Every step is exactly **one segment** so the start-node highlight anchors precisely
 * one move per card and the "Step X of N" progress maps 1:1 to drawing actions.
 *
 * The pool is four "I-know-it-but-can't-draw-it" subjects — things everyone pictures
 * instantly yet freezes on *how* to begin (the sharpest version of the lesson: a
 * vague ask leaves you stranded on procedure, a literal one dissolves it). Each is
 * drawn in detail so the structured build feels like a real little picture:
 *  - **droid** (21 steps): a domed-head robot — trapezoid dome → boxy body → antenna
 *    → eye lens → two panel bands → a data port → two legs with feet.
 *  - **alien** (31 steps): a blocky space creature — body box → two antennae with
 *    feelers → two eyes with pupils → two side arms → three legs.
 *  - **monster** (32 steps): a square-headed creature — head → two horns → two eyes
 *    with pupils → a Π-shaped fanged mouth.
 *  - **fighter** (26 steps): a space fighter — diamond cockpit with a window → two
 *    struts → two hexagonal wing panels with radial spokes.
 *
 * Coordinates are `(col,row)` nodes on the 22-col × 28-row grid (cols 0–21, rows
 * 0–27; `config.grid`), all comfortably inside the bounds. Orthogonal moves are
 * stated as an arrow + a square count; diagonal / non-45° moves state the explicit
 * (right N, up/down N) offset so each card stays literal and unambiguous and the
 * start-node highlight marks exactly where the move begins. Each subject's vague
 * Mode-1 ask lives in `content/mode1.instructions.ts`.
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
 * The droid: a domed-head robot.
 *  - outline (steps 1–6, closed loop): a trapezoid dome on top of a 10×12 body box
 *  - antenna (step 7): a stalk up from the dome
 *  - eye lens (steps 8–11, closed loop): a 4×2 rectangle on the dome
 *  - panel bands (steps 12–13): two horizontal lines across the body
 *  - data port (steps 14–17, closed loop): a 6×2 box on the body
 *  - legs + feet (steps 18–21): two stalks under the body, each with a foot
 */
export const droidSteps: Mode2Step[] = [
  {
    text: 'From the dot, go up-right (right 2, up 5) to the top of the dome.',
    segment: seg(6, 10, 8, 5),
  },
  {
    text: 'Go ➡️ right 6 squares along the top of the dome.',
    segment: seg(8, 5, 14, 5),
  },
  {
    text: 'Go down-right (right 2, down 5) to the shoulder.',
    segment: seg(14, 5, 16, 10),
  },
  {
    text: 'Go ⬇️ down 12 squares — the right side of the body.',
    segment: seg(16, 10, 16, 22),
  },
  {
    text: 'Go ⬅️ left 10 squares across the bottom.',
    segment: seg(16, 22, 6, 22),
  },
  {
    text: 'Go ⬆️ up 12 squares back to the dome. The body is done.',
    segment: seg(6, 22, 6, 10),
  },
  {
    text: 'Antenna: from the top of the dome, go ⬆️ up 3 squares.',
    segment: seg(11, 5, 11, 2),
  },
  { text: 'Eye: go ➡️ right 4 squares.', segment: seg(9, 6, 13, 6) },
  { text: 'Eye: go ⬇️ down 2 squares.', segment: seg(13, 6, 13, 8) },
  { text: 'Eye: go ⬅️ left 4 squares.', segment: seg(13, 8, 9, 8) },
  {
    text: 'Eye: go ⬆️ up 2 squares. That’s the lens.',
    segment: seg(9, 8, 9, 6),
  },
  {
    text: 'Panel: go ➡️ right 10 squares across the body.',
    segment: seg(6, 13, 16, 13),
  },
  {
    text: 'Panel: go ➡️ right 10 squares again, lower down.',
    segment: seg(6, 19, 16, 19),
  },
  { text: 'Port: go ➡️ right 6 squares.', segment: seg(8, 15, 14, 15) },
  { text: 'Port: go ⬇️ down 2 squares.', segment: seg(14, 15, 14, 17) },
  { text: 'Port: go ⬅️ left 6 squares.', segment: seg(14, 17, 8, 17) },
  {
    text: 'Port: go ⬆️ up 2 squares to close it.',
    segment: seg(8, 17, 8, 15),
  },
  {
    text: 'Leg: from the bottom, go ⬇️ down 3 squares.',
    segment: seg(8, 22, 8, 25),
  },
  { text: 'Foot: go ➡️ right 2 squares.', segment: seg(7, 25, 9, 25) },
  { text: 'Other leg: go ⬇️ down 3 squares.', segment: seg(14, 22, 14, 25) },
  {
    text: 'Other foot: go ➡️ right 2 squares. All done!',
    segment: seg(13, 25, 15, 25),
  },
];

/**
 * The alien: a blocky space creature, symmetric about col 11.
 *  - body box (steps 1–4, closed loop): 12×10
 *  - antennae + feelers (steps 5–8): two stalks up from the top, each tipped with a
 *    diagonal feeler
 *  - eyes (steps 9–12 left, 13–16 right): two 3×3 squares
 *  - pupils (steps 17–20 left, 21–24 right): a 1×1 square inside each eye
 *  - arms (steps 25–28): an L-shaped claw out each side
 *  - legs (steps 29–31): three stalks under the body
 */
export const alienSteps: Mode2Step[] = [
  {
    text: 'From the dot, go ➡️ right 12 squares across the top.',
    segment: seg(5, 8, 17, 8),
  },
  { text: 'Go ⬇️ down 10 squares.', segment: seg(17, 8, 17, 18) },
  {
    text: 'Go ⬅️ left 12 squares across the bottom.',
    segment: seg(17, 18, 5, 18),
  },
  {
    text: 'Go ⬆️ up 10 squares. The body is done.',
    segment: seg(5, 18, 5, 8),
  },
  {
    text: 'Antenna: from the top, go ⬆️ up 4 squares.',
    segment: seg(8, 8, 8, 4),
  },
  { text: 'Feeler: go up-left (left 2, up 2).', segment: seg(8, 4, 6, 2) },
  { text: 'Other antenna: go ⬆️ up 4 squares.', segment: seg(14, 8, 14, 4) },
  { text: 'Feeler: go up-right (right 2, up 2).', segment: seg(14, 4, 16, 2) },
  { text: 'Left eye: go ➡️ right 3 squares.', segment: seg(7, 10, 10, 10) },
  { text: 'Left eye: go ⬇️ down 3 squares.', segment: seg(10, 10, 10, 13) },
  { text: 'Left eye: go ⬅️ left 3 squares.', segment: seg(10, 13, 7, 13) },
  {
    text: 'Left eye: go ⬆️ up 3 squares to close it.',
    segment: seg(7, 13, 7, 10),
  },
  { text: 'Right eye: go ➡️ right 3 squares.', segment: seg(12, 10, 15, 10) },
  { text: 'Right eye: go ⬇️ down 3 squares.', segment: seg(15, 10, 15, 13) },
  { text: 'Right eye: go ⬅️ left 3 squares.', segment: seg(15, 13, 12, 13) },
  {
    text: 'Right eye: go ⬆️ up 3 squares to close it.',
    segment: seg(12, 13, 12, 10),
  },
  { text: 'Left pupil: go ➡️ right 1 square.', segment: seg(8, 11, 9, 11) },
  { text: 'Left pupil: go ⬇️ down 1 square.', segment: seg(9, 11, 9, 12) },
  { text: 'Left pupil: go ⬅️ left 1 square.', segment: seg(9, 12, 8, 12) },
  { text: 'Left pupil: go ⬆️ up 1 square.', segment: seg(8, 12, 8, 11) },
  { text: 'Right pupil: go ➡️ right 1 square.', segment: seg(13, 11, 14, 11) },
  { text: 'Right pupil: go ⬇️ down 1 square.', segment: seg(14, 11, 14, 12) },
  { text: 'Right pupil: go ⬅️ left 1 square.', segment: seg(14, 12, 13, 12) },
  { text: 'Right pupil: go ⬆️ up 1 square.', segment: seg(13, 12, 13, 11) },
  {
    text: 'Arm: from the body, go ⬅️ left 3 squares.',
    segment: seg(5, 12, 2, 12),
  },
  { text: 'Arm: go ⬇️ down 3 squares.', segment: seg(2, 12, 2, 15) },
  {
    text: 'Other arm: from the body, go ➡️ right 3 squares.',
    segment: seg(17, 12, 20, 12),
  },
  { text: 'Other arm: go ⬇️ down 3 squares.', segment: seg(20, 12, 20, 15) },
  {
    text: 'Leg: from the bottom, go ⬇️ down 3 squares.',
    segment: seg(7, 18, 7, 21),
  },
  { text: 'Middle leg: go ⬇️ down 3 squares.', segment: seg(11, 18, 11, 21) },
  {
    text: 'Last leg: go ⬇️ down 3 squares. All done!',
    segment: seg(15, 18, 15, 21),
  },
];

/**
 * The monster: a square-headed creature, symmetric about col 11.
 *  - head (steps 1–4, closed loop): 12×12
 *  - horns (steps 5–8): two spikes on top
 *  - eyes (steps 9–12 left, 13–16 right): two 3×3 squares
 *  - pupils (steps 17–20 left, 21–24 right): a 1×1 square inside each eye
 *  - mouth (steps 25–32, closed loop): a Π-shaped fanged frown
 */
export const monsterSteps: Mode2Step[] = [
  {
    text: 'From the dot, go ➡️ right 12 squares.',
    segment: seg(5, 4, 17, 4),
  },
  { text: 'Go ⬇️ down 12 squares.', segment: seg(17, 4, 17, 16) },
  { text: 'Go ⬅️ left 12 squares.', segment: seg(17, 16, 5, 16) },
  { text: 'Go ⬆️ up 12 squares. The head is done.', segment: seg(5, 16, 5, 4) },
  { text: 'Horn: go up-right (right 1, up 3).', segment: seg(7, 4, 8, 1) },
  { text: 'Horn: go down-right (right 1, down 3).', segment: seg(8, 1, 9, 4) },
  {
    text: 'Other horn: go up-right (right 1, up 3).',
    segment: seg(13, 4, 14, 1),
  },
  {
    text: 'Other horn: go down-right (right 1, down 3).',
    segment: seg(14, 1, 15, 4),
  },
  { text: 'Left eye: go ➡️ right 3 squares.', segment: seg(7, 6, 10, 6) },
  { text: 'Left eye: go ⬇️ down 3 squares.', segment: seg(10, 6, 10, 9) },
  { text: 'Left eye: go ⬅️ left 3 squares.', segment: seg(10, 9, 7, 9) },
  {
    text: 'Left eye: go ⬆️ up 3 squares to close it.',
    segment: seg(7, 9, 7, 6),
  },
  { text: 'Right eye: go ➡️ right 3 squares.', segment: seg(12, 6, 15, 6) },
  { text: 'Right eye: go ⬇️ down 3 squares.', segment: seg(15, 6, 15, 9) },
  { text: 'Right eye: go ⬅️ left 3 squares.', segment: seg(15, 9, 12, 9) },
  {
    text: 'Right eye: go ⬆️ up 3 squares to close it.',
    segment: seg(12, 9, 12, 6),
  },
  { text: 'Left pupil: go ➡️ right 1 square.', segment: seg(8, 7, 9, 7) },
  { text: 'Left pupil: go ⬇️ down 1 square.', segment: seg(9, 7, 9, 8) },
  { text: 'Left pupil: go ⬅️ left 1 square.', segment: seg(9, 8, 8, 8) },
  { text: 'Left pupil: go ⬆️ up 1 square.', segment: seg(8, 8, 8, 7) },
  { text: 'Right pupil: go ➡️ right 1 square.', segment: seg(13, 7, 14, 7) },
  { text: 'Right pupil: go ⬇️ down 1 square.', segment: seg(14, 7, 14, 8) },
  { text: 'Right pupil: go ⬅️ left 1 square.', segment: seg(14, 8, 13, 8) },
  { text: 'Right pupil: go ⬆️ up 1 square.', segment: seg(13, 8, 13, 7) },
  { text: 'Mouth: go ➡️ right 4 squares.', segment: seg(9, 11, 13, 11) },
  { text: 'Mouth: go ⬇️ down 4 squares.', segment: seg(13, 11, 13, 15) },
  { text: 'Mouth: go ⬅️ left 1 square.', segment: seg(13, 15, 12, 15) },
  { text: 'Mouth: go ⬆️ up 3 squares.', segment: seg(12, 15, 12, 12) },
  { text: 'Mouth: go ⬅️ left 2 squares.', segment: seg(12, 12, 10, 12) },
  { text: 'Mouth: go ⬇️ down 3 squares.', segment: seg(10, 12, 10, 15) },
  { text: 'Mouth: go ⬅️ left 1 square.', segment: seg(10, 15, 9, 15) },
  {
    text: 'Mouth: go ⬆️ up 4 squares to close it. All done!',
    segment: seg(9, 15, 9, 11),
  },
];

/**
 * The fighter: a space fighter, symmetric about col 11.
 *  - cockpit (steps 1–4, closed loop): a diamond around (11,14)
 *  - window (steps 5–8, closed loop): a small diamond inside the cockpit
 *  - struts (steps 9, 18): one line out to each wing
 *  - wings (steps 10–15 left, 19–24 right): two tall hexagonal panels; the strut
 *    meets the middle of each wing's inner edge
 *  - wing spokes (steps 16–17 left, 25–26 right): a vertical + horizontal line across
 *    each wing
 */
export const fighterSteps: Mode2Step[] = [
  {
    text: 'From the dot, go down-right (right 3, down 4).',
    segment: seg(11, 10, 14, 14),
  },
  { text: 'Go down-left (left 3, down 4).', segment: seg(14, 14, 11, 18) },
  { text: 'Go up-left (left 3, up 4).', segment: seg(11, 18, 8, 14) },
  {
    text: 'Go up-right (right 3, up 4). The cockpit is done.',
    segment: seg(8, 14, 11, 10),
  },
  {
    text: 'Window: go down-right (right 2, down 2).',
    segment: seg(11, 12, 13, 14),
  },
  {
    text: 'Window: go down-left (left 2, down 2).',
    segment: seg(13, 14, 11, 16),
  },
  { text: 'Window: go up-left (left 2, up 2).', segment: seg(11, 16, 9, 14) },
  {
    text: 'Window: go up-right (right 2, up 2) to close it.',
    segment: seg(9, 14, 11, 12),
  },
  { text: 'Strut: go ⬅️ left 3 squares.', segment: seg(8, 14, 5, 14) },
  { text: 'Wing: go up-left (left 2, up 2).', segment: seg(5, 11, 3, 9) },
  { text: 'Go down-left (left 2, down 2).', segment: seg(3, 9, 1, 11) },
  { text: 'Go ⬇️ down 6 squares.', segment: seg(1, 11, 1, 17) },
  { text: 'Go down-right (right 2, down 2).', segment: seg(1, 17, 3, 19) },
  { text: 'Go up-right (right 2, up 2).', segment: seg(3, 19, 5, 17) },
  {
    text: 'Go ⬆️ up 6 squares. The left wing is done.',
    segment: seg(5, 17, 5, 11),
  },
  { text: 'Wing spoke: go ⬇️ down 10 squares.', segment: seg(3, 9, 3, 19) },
  { text: 'Wing spoke: go ➡️ right 4 squares.', segment: seg(1, 14, 5, 14) },
  { text: 'Other strut: go ➡️ right 3 squares.', segment: seg(14, 14, 17, 14) },
  { text: 'Wing: go up-right (right 2, up 2).', segment: seg(17, 11, 19, 9) },
  { text: 'Go down-right (right 2, down 2).', segment: seg(19, 9, 21, 11) },
  { text: 'Go ⬇️ down 6 squares.', segment: seg(21, 11, 21, 17) },
  { text: 'Go down-left (left 2, down 2).', segment: seg(21, 17, 19, 19) },
  { text: 'Go up-left (left 2, up 2).', segment: seg(19, 19, 17, 17) },
  {
    text: 'Go ⬆️ up 6 squares. The right wing is done.',
    segment: seg(17, 17, 17, 11),
  },
  { text: 'Wing spoke: go ⬇️ down 10 squares.', segment: seg(19, 9, 19, 19) },
  {
    text: 'Wing spoke: go ➡️ right 4 squares. All done!',
    segment: seg(17, 14, 21, 14),
  },
];

/** Each subject's intended result — the ordered step segments on the shared grid. */
const targetOf = (steps: Mode2Step[]): GridDrawing => ({
  kind: 'grid',
  segments: steps.map((s) => s.segment),
  grid: { cols: config.grid.cols, rows: config.grid.rows },
});

export const droidTarget: GridDrawing = targetOf(droidSteps);
export const alienTarget: GridDrawing = targetOf(alienSteps);
export const monsterTarget: GridDrawing = targetOf(monsterSteps);
export const fighterTarget: GridDrawing = targetOf(fighterSteps);
