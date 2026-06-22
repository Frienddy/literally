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
 * The pool is five "I-know-it-but-can't-draw-it" subjects — things everyone pictures
 * instantly yet freezes on *how* to begin (the sharpest version of the lesson: a
 * vague ask leaves you stranded on procedure, a literal one dissolves it). Each is
 * drawn in detail so the structured build feels like a real little picture:
 *  - **droid** (21 steps): a domed-head robot — trapezoid dome → boxy body → antenna
 *    → eye lens → two panel bands → a data port → two legs with feet.
 *  - **alien** (31 steps): a blocky space creature — body box → two antennae with
 *    feelers → two eyes with pupils → two side arms → three legs.
 *  - **mario** (35 steps): the plumber mid-jump — peaked cap with an emblem → face
 *    with eyes, a big nose and a moustache → body → two raised fists → two kicked-out
 *    legs with feet. Asymmetry is intentional here: it sells the leap.
 *  - **fighter** (26 steps): a space fighter — diamond cockpit with a window → two
 *    struts → two hexagonal wing panels with radial spokes.
 *  - **monalisa** (53 steps): the portrait — centre-parted hair framing an oval face
 *    → brows, two almond eyes, nose and the faint smile → neck → the pyramidal dress
 *    with its scoop neckline → the folded hands with finger lines. The most detailed
 *    subject: a half-length Renaissance portrait built dot by dot.
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
 * Mario, mid-jump — a blocky plumber leaping with both fists up. Unlike the other
 * subjects this one is **not** mirror-symmetric in feel: the raised arms and the
 * kicked-out legs read as a leap, which is the whole point of the pose.
 *  - cap (steps 1–4, closed loop): a wide brim under a peaked dome
 *  - cap emblem (steps 5–8, closed loop): the little badge on the front of the cap
 *  - face (steps 9–12, closed loop): an 8×5 box tucked under the brim
 *  - eyes (steps 13–14): two short vertical strokes either side of the nose
 *  - nose (steps 15–18, closed loop): a 2×2 box — Mario's big round nose
 *  - moustache (step 19): a wide line under the nose
 *  - body (steps 20–23, closed loop): a 10×6 box — the overalls
 *  - arms (steps 24–29): a bent arm up each side, each tipped with a raised fist
 *  - legs (steps 30–35): a bent leg kicked out each side, each ending in a foot
 */
export const marioSteps: Mode2Step[] = [
  {
    text: 'From the dot, go ➡️ right 12 squares — the brim of the cap.',
    segment: seg(5, 6, 17, 6),
  },
  {
    text: 'Go up-left (left 2, up 3) to the peak of the cap.',
    segment: seg(17, 6, 15, 3),
  },
  { text: 'Go ⬅️ left 8 squares across the top.', segment: seg(15, 3, 7, 3) },
  {
    text: 'Go down-left (left 2, down 3) back to the brim. The cap is done.',
    segment: seg(7, 3, 5, 6),
  },
  { text: 'Emblem: go ➡️ right 2 squares.', segment: seg(10, 4, 12, 4) },
  { text: 'Emblem: go ⬇️ down 2 squares.', segment: seg(12, 4, 12, 6) },
  { text: 'Emblem: go ⬅️ left 2 squares.', segment: seg(12, 6, 10, 6) },
  {
    text: 'Emblem: go ⬆️ up 2 squares to close it.',
    segment: seg(10, 6, 10, 4),
  },
  { text: 'Face: go ➡️ right 8 squares.', segment: seg(7, 6, 15, 6) },
  { text: 'Face: go ⬇️ down 5 squares.', segment: seg(15, 6, 15, 11) },
  { text: 'Face: go ⬅️ left 8 squares.', segment: seg(15, 11, 7, 11) },
  {
    text: 'Face: go ⬆️ up 5 squares. The face is done.',
    segment: seg(7, 11, 7, 6),
  },
  { text: 'Left eye: go ⬇️ down 2 squares.', segment: seg(9, 7, 9, 9) },
  { text: 'Right eye: go ⬇️ down 2 squares.', segment: seg(13, 7, 13, 9) },
  { text: 'Nose: go ➡️ right 2 squares.', segment: seg(10, 7, 12, 7) },
  { text: 'Nose: go ⬇️ down 2 squares.', segment: seg(12, 7, 12, 9) },
  { text: 'Nose: go ⬅️ left 2 squares.', segment: seg(12, 9, 10, 9) },
  {
    text: 'Nose: go ⬆️ up 2 squares to close it.',
    segment: seg(10, 9, 10, 7),
  },
  {
    text: 'Moustache: go ➡️ right 6 squares under the nose.',
    segment: seg(8, 10, 14, 10),
  },
  {
    text: 'Body: go ➡️ right 10 squares for the shoulders.',
    segment: seg(6, 11, 16, 11),
  },
  { text: 'Body: go ⬇️ down 6 squares.', segment: seg(16, 11, 16, 17) },
  { text: 'Body: go ⬅️ left 10 squares.', segment: seg(16, 17, 6, 17) },
  {
    text: 'Body: go ⬆️ up 6 squares. The body is done.',
    segment: seg(6, 17, 6, 11),
  },
  {
    text: 'Left arm: from the shoulder, go up-left (left 3, up 2).',
    segment: seg(6, 11, 3, 9),
  },
  { text: 'Go ⬆️ up 4 squares to raise the arm.', segment: seg(3, 9, 3, 5) },
  { text: 'Left fist: go ⬅️ left 2 squares.', segment: seg(3, 5, 1, 5) },
  {
    text: 'Right arm: from the shoulder, go up-right (right 3, up 2).',
    segment: seg(16, 11, 19, 9),
  },
  {
    text: 'Go ⬆️ up 4 squares to raise the arm.',
    segment: seg(19, 9, 19, 5),
  },
  { text: 'Right fist: go ➡️ right 2 squares.', segment: seg(19, 5, 21, 5) },
  {
    text: 'Left leg: from the body, go down-left (left 3, down 3).',
    segment: seg(8, 17, 5, 20),
  },
  {
    text: 'Go down-right (right 1, down 3) to the foot.',
    segment: seg(5, 20, 6, 23),
  },
  { text: 'Left foot: go ⬅️ left 2 squares.', segment: seg(6, 23, 4, 23) },
  {
    text: 'Right leg: from the body, go down-right (right 3, down 3).',
    segment: seg(14, 17, 17, 20),
  },
  {
    text: 'Go down-left (left 1, down 3) to the foot.',
    segment: seg(17, 20, 16, 23),
  },
  {
    text: 'Right foot: go ➡️ right 2 squares. All done!',
    segment: seg(16, 23, 18, 23),
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

/**
 * The Mona Lisa — a half-length Renaissance portrait, the most detailed subject.
 * Centred about col 11, built top-down so each part reads as it lands:
 *  - hair crown (steps 1–4): a centre-parted arc over the head
 *  - hair locks (steps 5–7 right, 8–10 left): two strands falling past the cheeks to
 *    the shoulders
 *  - face (steps 11–18, closed loop): an eight-sided oval — forehead, temples, cheeks,
 *    jaw and chin
 *  - brows (steps 19–20): two faint strokes
 *  - eyes (steps 21–24 left, 25–28 right, closed loops): two small almond diamonds
 *  - nose (steps 29–31): a bridge down the centre with two nostril flares
 *  - smile (steps 32–33): the famous faint upward curve
 *  - neck (steps 34–35): two short strokes down to the shoulders
 *  - dress (steps 36–44, closed loop): the pyramidal body with a scooped neckline
 *  - folded hands (steps 45–50, closed loop): the lozenge of crossed hands in her lap
 *  - fingers (steps 51–53): three short strokes across the top hand
 */
export const monalisaSteps: Mode2Step[] = [
  {
    text: 'From the dot, go up-right (right 1, up 3) to the top of the hair.',
    segment: seg(7, 4, 8, 1),
  },
  {
    text: 'Go down-right (right 3, down 1) to the centre parting.',
    segment: seg(8, 1, 11, 2),
  },
  {
    text: 'Go up-right (right 3, up 1) to the other side of the crown.',
    segment: seg(11, 2, 14, 1),
  },
  {
    text: 'Go down-right (right 1, down 3). The crown of hair is done.',
    segment: seg(14, 1, 15, 4),
  },
  {
    text: 'Right lock: go down-right (right 2, down 3) past the temple.',
    segment: seg(15, 4, 17, 7),
  },
  {
    text: 'Go ⬇️ down 5 squares beside the cheek.',
    segment: seg(17, 7, 17, 12),
  },
  {
    text: 'Go down-left (left 1, down 4) to the shoulder. The lock falls.',
    segment: seg(17, 12, 16, 16),
  },
  {
    text: 'Left lock: from the crown, go down-left (left 2, down 3).',
    segment: seg(7, 4, 5, 7),
  },
  { text: 'Go ⬇️ down 5 squares beside the cheek.', segment: seg(5, 7, 5, 12) },
  {
    text: 'Go down-right (right 1, down 4) to the other shoulder.',
    segment: seg(5, 12, 6, 16),
  },
  {
    text: 'Face: from the hairline, go ➡️ right 4 squares across the forehead.',
    segment: seg(9, 3, 13, 3),
  },
  {
    text: 'Go down-right (right 2, down 2) to the right temple.',
    segment: seg(13, 3, 15, 5),
  },
  { text: 'Go ⬇️ down 4 squares down the cheek.', segment: seg(15, 5, 15, 9) },
  {
    text: 'Go down-left (left 3, down 5) along the jaw to the chin.',
    segment: seg(15, 9, 12, 14),
  },
  {
    text: 'Go ⬅️ left 2 squares across the chin.',
    segment: seg(12, 14, 10, 14),
  },
  {
    text: 'Go up-left (left 3, up 5) up the other jaw.',
    segment: seg(10, 14, 7, 9),
  },
  { text: 'Go ⬆️ up 4 squares up the cheek.', segment: seg(7, 9, 7, 5) },
  {
    text: 'Go up-right (right 2, up 2) to close the face.',
    segment: seg(7, 5, 9, 3),
  },
  { text: 'Left brow: go ➡️ right 2 squares.', segment: seg(8, 6, 10, 6) },
  { text: 'Right brow: go ➡️ right 2 squares.', segment: seg(12, 6, 14, 6) },
  {
    text: 'Left eye: go up-right (right 1, up 1).',
    segment: seg(8, 8, 9, 7),
  },
  { text: 'Go down-right (right 1, down 1).', segment: seg(9, 7, 10, 8) },
  { text: 'Go down-left (left 1, down 1).', segment: seg(10, 8, 9, 9) },
  {
    text: 'Go up-left (left 1, up 1) to close the eye.',
    segment: seg(9, 9, 8, 8),
  },
  {
    text: 'Right eye: go up-right (right 1, up 1).',
    segment: seg(12, 8, 13, 7),
  },
  { text: 'Go down-right (right 1, down 1).', segment: seg(13, 7, 14, 8) },
  { text: 'Go down-left (left 1, down 1).', segment: seg(14, 8, 13, 9) },
  {
    text: 'Go up-left (left 1, up 1) to close the eye.',
    segment: seg(13, 9, 12, 8),
  },
  {
    text: 'Nose: from between the eyes, go ⬇️ down 3 squares.',
    segment: seg(11, 7, 11, 10),
  },
  {
    text: 'Left nostril: go down-left (left 1, down 1).',
    segment: seg(11, 10, 10, 11),
  },
  {
    text: 'Right nostril: from the nose tip, go down-right (right 1, down 1).',
    segment: seg(11, 10, 12, 11),
  },
  {
    text: 'Smile: go down-right (right 2, down 1).',
    segment: seg(9, 12, 11, 13),
  },
  {
    text: 'Go up-right (right 2, up 1). The faint smile is done.',
    segment: seg(11, 13, 13, 12),
  },
  {
    text: 'Left neck: from the jaw, go ⬇️ down 3 squares.',
    segment: seg(9, 14, 9, 17),
  },
  {
    text: 'Right neck: from the jaw, go ⬇️ down 3 squares.',
    segment: seg(13, 14, 13, 17),
  },
  {
    text: 'Dress: from the left shoulder, go down-left (left 3, down 4).',
    segment: seg(7, 17, 4, 21),
  },
  {
    text: 'Go down-left (left 1, down 5) to the hem.',
    segment: seg(4, 21, 3, 26),
  },
  {
    text: 'Go ➡️ right 16 squares across the hem.',
    segment: seg(3, 26, 19, 26),
  },
  {
    text: 'Go up-left (left 1, up 5) up the side.',
    segment: seg(19, 26, 18, 21),
  },
  {
    text: 'Go up-left (left 3, up 4) to the right shoulder.',
    segment: seg(18, 21, 15, 17),
  },
  {
    text: 'Go ⬅️ left 2 squares to the neckline.',
    segment: seg(15, 17, 13, 17),
  },
  {
    text: 'Go down-left (left 2, down 2) into the scoop neckline.',
    segment: seg(13, 17, 11, 19),
  },
  {
    text: 'Go up-left (left 2, up 2) out of the scoop.',
    segment: seg(11, 19, 9, 17),
  },
  {
    text: 'Go ⬅️ left 2 squares. The dress is done.',
    segment: seg(9, 17, 7, 17),
  },
  {
    text: 'Hands: go ➡️ right 6 squares across the top of the folded hands.',
    segment: seg(8, 20, 14, 20),
  },
  {
    text: 'Go down-right (right 2, down 2) round the right end.',
    segment: seg(14, 20, 16, 22),
  },
  {
    text: 'Go down-left (left 2, down 2) to the bottom.',
    segment: seg(16, 22, 14, 24),
  },
  {
    text: 'Go ⬅️ left 6 squares along the bottom.',
    segment: seg(14, 24, 8, 24),
  },
  {
    text: 'Go up-left (left 2, up 2) round the left end.',
    segment: seg(8, 24, 6, 22),
  },
  {
    text: 'Go up-right (right 2, up 2) to close the hands.',
    segment: seg(6, 22, 8, 20),
  },
  { text: 'Finger: go ⬇️ down 2 squares.', segment: seg(9, 21, 9, 23) },
  { text: 'Finger: go ⬇️ down 2 squares.', segment: seg(11, 21, 11, 23) },
  {
    text: 'Last finger: go ⬇️ down 2 squares. All done!',
    segment: seg(13, 21, 13, 23),
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
export const marioTarget: GridDrawing = targetOf(marioSteps);
export const fighterTarget: GridDrawing = targetOf(fighterSteps);
export const monalisaTarget: GridDrawing = targetOf(monalisaSteps);
