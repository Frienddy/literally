/**
 * Mode 2 — the literal, one-at-a-time step sequences for the **task pool** (FR-20,
 * formerly _docs/01 §4.2). Content is **data, not JSX** (ADR-007): each step pairs a
 * player-facing instruction with the single grid *cell* it fills and the color to
 * fill it, so the same array drives the step cards, the on-grid target highlight,
 * and the hidden target the Reflection reveals (ADR-010).
 *
 * Every step is exactly **one square** so the target highlight anchors precisely one
 * move per card and the "Step X of N" progress maps 1:1 to painting actions. The
 * subject is built square by square in reading order (top-left → bottom-right), so
 * the picture grows the way you'd colour it in.
 *
 * The pool is five "I-know-it-but-can't-draw-it" subjects — things everyone pictures
 * instantly yet freezes on *how* to begin (the sharpest version of the lesson: a
 * vague ask leaves you stranded on procedure, a literal one dissolves it). Each is
 * authored as a tiny ASCII sprite (one char per cell) and expanded into per-cell
 * steps + a `PixelDrawing` target by {@link buildSprite}, so the art stays editable
 * by non-engineers and the steps/target can never drift apart.
 *
 * Sprite chars map to `config.palette` color names via {@link CHAR_TO_NAME}; `.`
 * (or space) is an empty cell. Each sprite is centered on the shared 16×20 cell grid
 * (`config.grid`). Each subject's vague Mode-1 ask lives in
 * `content/mode1.instructions.ts`.
 */
import type { GridNode, PixelDrawing } from '../types/session';
import { config } from '../config';

export interface Mode2Step {
  /** The literal, unambiguous instruction shown on this step's card. */
  text: string;
  /** The single grid cell the player fills to satisfy this step. */
  cell: GridNode;
  /** The color to fill it (a `config.palette` hex). */
  color: string;
}

const GRID = { cols: config.grid.cols, rows: config.grid.rows };

/** color name → painted hex (the palette is the single source of truth). */
const NAME_TO_HEX: Record<string, string> = Object.fromEntries(
  config.palette.map((c) => [c.name, c.hex]),
);

/** Sprite char → palette color name. `.`/space mean "leave this cell empty". */
const CHAR_TO_NAME: Record<string, string> = {
  K: 'black',
  A: 'grey',
  W: 'white',
  R: 'red',
  O: 'orange',
  Y: 'yellow',
  G: 'green',
  T: 'teal',
  B: 'blue',
  P: 'purple',
  M: 'brown',
  S: 'peach',
};

/**
 * Expand an ASCII sprite into ordered per-cell steps + the matching target. The
 * sprite is centered on the shared grid; every non-empty char becomes one "fill the
 * highlighted square <color>" step, and the target is exactly those cells — so the
 * picture the steps build IS the hidden target (ADR-010), with no chance of drift.
 */
function buildSprite(rows: string[]): {
  steps: Mode2Step[];
  target: PixelDrawing;
} {
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const offX = Math.floor((GRID.cols - width) / 2);
  const offY = Math.floor((GRID.rows - height) / 2);

  const steps: Mode2Step[] = [];
  rows.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
      const ch = line[x];
      if (ch === '.' || ch === ' ') continue;
      const name = CHAR_TO_NAME[ch];
      if (!name) throw new Error(`mode2.steps: unknown sprite char "${ch}"`);
      const color = NAME_TO_HEX[name];
      if (!color)
        throw new Error(`mode2.steps: "${name}" is not in config.palette`);
      steps.push({
        text: `Fill the highlighted square ${name}.`,
        cell: { col: offX + x, row: offY + y },
        color,
      });
    }
  });

  const target: PixelDrawing = {
    kind: 'pixel',
    cells: steps.map((s) => ({
      col: s.cell.col,
      row: s.cell.row,
      color: s.color,
    })),
    grid: { cols: GRID.cols, rows: GRID.rows },
  };
  return { steps, target };
}

/**
 * The droid: a domed-head robot — black antenna, grey dome with a blue visor, a red
 * panel on a boxy body, and two stubby legs with feet. (34 squares.)
 */
const droid = buildSprite([
  '..KK..',
  '.AAAA.',
  'ABBBBA',
  'AAAAAA',
  'ARRRRA',
  'AAAAAA',
  'A....A',
  'K....K',
]);
export const droidSteps = droid.steps;
export const droidTarget = droid.target;

/**
 * The alien: a blocky green creature — two teal antennae, a green head with a white
 * eye-band and two black pupils, and three little legs. (36 squares.)
 */
const alien = buildSprite([
  'T....T',
  '.G..G.',
  '.GGGG.',
  'GGGGGG',
  'GWWWWG',
  'GKWWKG',
  'GGGGGG',
  'G.GG.G',
]);
export const alienSteps = alien.steps;
export const alienTarget = alien.target;

/**
 * Mario: the plumber — a red cap, a peach face with two eyes and a brown moustache,
 * a red shirt over blue overalls, two peach hands, and brown shoes. (39 squares.)
 */
const mario = buildSprite([
  '.RRRRR.',
  'RRRRRRR',
  '.MSSSM.',
  '.SKSKS.',
  '.MMMMM.',
  '.RRRRR.',
  'S.BBB.S',
  '.M...M.',
]);
export const marioSteps = mario.steps;
export const marioTarget = mario.target;

/**
 * The fighter: a space ship — a grey hull with a blue cockpit window, swept grey
 * wings, and two orange thruster flames. (26 squares.)
 */
const fighter = buildSprite([
  '...A...',
  '..AAA..',
  '.ABBBA.',
  'AAAAAAA',
  'A.AAA.A',
  '..AAA..',
  '..O.O..',
]);
export const fighterSteps = fighter.steps;
export const fighterTarget = fighter.target;

/**
 * The Mona Lisa: a portrait — brown centre-parted hair framing a peach oval face
 * with two eyes, a neck, and the dark pyramidal dress. (50 squares.)
 */
const monalisa = buildSprite([
  '.MMMMM.',
  'MMMMMMM',
  'MSSSSSM',
  'MSKSKSM',
  'MSSSSSM',
  '.SSSSS.',
  '.KKKKK.',
  'KKKKKKK',
]);
export const monalisaSteps = monalisa.steps;
export const monalisaTarget = monalisa.target;
