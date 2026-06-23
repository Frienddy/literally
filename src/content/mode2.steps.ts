/**
 * Mode 2 — the literal, coordinate-based step sequences for the **task pool** (FR-20,
 * formerly _docs/01 §4.2). Content is **data, not JSX** (ADR-007): each step is a
 * short horizontal **run** that pairs a player-facing, coordinate-based instruction
 * ("start at row 6, col 3: fill 4 squares → with color 1 (black)") with the exact
 * cells it fills and the numbered palette color to fill them, so the same array
 * drives the step cards, the on-grid run highlight, the numbered-color legend, and
 * the hidden target the Reflection reveals (ADR-010).
 *
 * A step is a **run of one or more cells in the same row and color** — the picture
 * is built one strip at a time, left→right, top→bottom (reading order), the way you'd
 * colour in a pattern. Runs are the natural unit of a coordinate-based instruction:
 * "fill N squares to the right" reads literally and maps 1:1 to the highlighted strip.
 * The grid's rows/cols and the palette are **numbered** (1-based) so the steps can
 * name them ("row 6", "col 3", "color 1") and the player reads them off the labelled
 * grid + legend — the sharpest "with clear instruction" contrast to Mode 1's nothing.
 *
 * The pool is five "I-know-it-but-can't-draw-it" subjects — things everyone pictures
 * instantly yet freezes on *how* to begin. Each is authored as a tiny ASCII sprite
 * (one char per cell) and expanded into per-run steps + a `PixelDrawing` target by
 * {@link buildSprite} (run-length-encoding each row), so the art stays editable by
 * non-engineers and the steps/target can never drift apart.
 *
 * Sprite chars map to `config.palette` color names via {@link CHAR_TO_NAME}; `.`
 * (or space) is an empty cell. Each sprite is centered on the shared 16×20 cell grid
 * (`config.grid`). Each subject's vague Mode-1 ask lives in
 * `content/mode1.instructions.ts`.
 */
import type { GridNode, PixelDrawing } from '../types/session';
import { config } from '../config';

export interface Mode2Step {
  /** The literal, coordinate-based instruction shown on this step's card. */
  text: string;
  /** The run's start cell (0-based grid coords) — the "anchor" the player finds first. */
  start: GridNode;
  /** How many cells the run fills, left→right from {@link start} (same row). */
  length: number;
  /** Every cell the run fills, ordered left→right (the highlighted strip). */
  cells: GridNode[];
  /** The color the whole run is filled with (a `config.palette` hex). */
  color: string;
  /** 1-based palette index — the "color N" the player reads off the legend. */
  colorIndex: number;
  /** The palette color's name, shown in the step text + legend (a11y, never color-only). */
  colorName: string;
}

const GRID = { cols: config.grid.cols, rows: config.grid.rows };

/** color name → painted hex (the palette is the single source of truth). */
const NAME_TO_HEX: Record<string, string> = Object.fromEntries(
  config.palette.map((c) => [c.name, c.hex]),
);

/** color name → 1-based palette index (the "color N" shown to the player). */
const NAME_TO_INDEX: Record<string, number> = Object.fromEntries(
  config.palette.map((c, i) => [c.name, i + 1]),
);

/** Sprite char → palette color name. `.`/space mean "leave this cell empty". */
const CHAR_TO_NAME: Record<string, string> = {
  K: 'black',
  A: 'grey',
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
 * Compose the literal, coordinate-based instruction for one run. Rows/cols/colors
 * are shown **1-based** to match the numbers labelled on the grid + legend (the
 * player never has to translate). The name rides along with the color number so the
 * cue is never color-only (a11y).
 */
function stepText(
  row: number,
  startCol: number,
  len: number,
  colorIndex: number,
  name: string,
): string {
  const r = row + 1;
  const c = startCol + 1;
  const color = `color ${colorIndex} (${name})`;
  return len === 1
    ? `Start at row ${r}, col ${c}: fill this square with ${color}.`
    : `Start at row ${r}, col ${c}: fill ${len} squares → with ${color}.`;
}

/**
 * Expand an ASCII sprite into ordered per-run steps + the matching target. The
 * sprite is centered on the shared grid; each maximal horizontal stretch of one
 * color becomes a "fill N squares → with color K" run, and the target is exactly
 * those cells in order — so the picture the steps build IS the hidden target
 * (ADR-010), with no chance of drift.
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
    let x = 0;
    while (x < line.length) {
      const ch = line[x];
      if (ch === '.' || ch === ' ') {
        x++;
        continue;
      }
      const name = CHAR_TO_NAME[ch];
      if (!name) throw new Error(`mode2.steps: unknown sprite char "${ch}"`);
      const color = NAME_TO_HEX[name];
      if (!color)
        throw new Error(`mode2.steps: "${name}" is not in config.palette`);
      const colorIndex = NAME_TO_INDEX[name];

      // Extend the run while the *same* char (= same color) continues.
      let len = 1;
      while (x + len < line.length && line[x + len] === ch) len++;

      const startCol = offX + x;
      const row = offY + y;
      const cells: GridNode[] = [];
      for (let i = 0; i < len; i++) cells.push({ col: startCol + i, row });

      steps.push({
        text: stepText(row, startCol, len, colorIndex, name),
        start: { col: startCol, row },
        length: len,
        cells,
        color,
        colorIndex,
        colorName: name,
      });
      x += len;
    }
  });

  const target: PixelDrawing = {
    kind: 'pixel',
    cells: steps.flatMap((s) =>
      s.cells.map((c) => ({ col: c.col, row: c.row, color: s.color })),
    ),
    grid: { cols: GRID.cols, rows: GRID.rows },
  };
  return { steps, target };
}

/**
 * R2-D2, head-on — the astromech droid everyone pictures instantly: a black
 * periscope nub atop a silver half-dome, the single blue camera eye, and a barrel
 * body carrying blue side panels, a red logic-display strip and a round blue data
 * port, standing on two legs with wide flat feet. (73 squares.)
 */
const droid = buildSprite([
  '...K....',
  '..AAAA..',
  '.AAAAAA.',
  '.AKBBKA.',
  '.AAAAAA.',
  'AAAAAAAA',
  'ABBAABBA',
  'AAARRAAA',
  'AABBBBAA',
  'AAAAAAAA',
  '.AA..AA.',
  'KKK..KKK',
]);
export const droidSteps = droid.steps;
export const droidTarget = droid.target;

/**
 * The alien: a blocky green creature — two teal antennae, a green head with a grey
 * eye-band and two black pupils, and three little legs. (36 squares.)
 */
const alien = buildSprite([
  'T....T',
  '.G..G.',
  '.GGGG.',
  'GGGGGG',
  'GAAAAG',
  'GKAAKG',
  'GGGGGG',
  'G.GG.G',
]);
export const alienSteps = alien.steps;
export const alienTarget = alien.target;

/**
 * Mario, standing — the plumber's calm idle pose seen side-on, facing right (the
 * canonical NES small-Mario sprite): a red cap with a forward brim, brown hair and a
 * sideburn, one eye and a thick brown moustache, a red shirt under blue overalls with
 * a yellow button and straps, peach hands resting at his sides, feet planted, and
 * brown shoes. (118 squares.)
 */
const mario = buildSprite([
  '....RRRRR....',
  '...RRRRRRRR..',
  '...MMMSSSSS..',
  '..MMSSSSKSS..',
  '..MMMMMMMSS..',
  '...SSSSSSS...',
  '....SSSSS....',
  '...RRRRRRR...',
  '..RRRBYBRRR..',
  '.SSRRBBBRRSS.',
  '.SSRBBBBBRSS.',
  '..SBBBBBBBS..',
  '...BBB.BBB...',
  '...MMM.MMM...',
  '..MMMM.MMMM..',
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
 * The Mona Lisa, three-quarter portrait — long brown hair parts over the crown and
 * frames a peach oval face: two dark eyes (and, famously, no eyebrows), a centred
 * nose, and the faint half-smile. Below, a long neck drops to sloping shoulders in a
 * black dress with a peach neckline, and her hands rest folded near the bottom.
 * (172 squares.)
 */
const monalisa = buildSprite([
  '....MMMMM....',
  '..MMMMMMMMM..',
  '.MMMMMMMMMMM.',
  '.MMSSSSSSSMM.',
  '.MMSKSSSKSMM.',
  '.MMSSSSSSSMM.',
  '.MMSSSKSSSMM.',
  '.MMSSKKKSSMM.',
  '.MMSSSSSSSMM.',
  '.MMMSSSSSMMM.',
  '..MM.SSS.MM..',
  '.MMMMSSSMMMM.',
  'MMKKKSSSKKKMM',
  'KKKKKKKKKKKKK',
  'KKKKSSSSSKKKK',
  'KKKKKKKKKKKKK',
]);
export const monalisaSteps = monalisa.steps;
export const monalisaTarget = monalisa.target;

/**
 * The UFO abducting a cow: a teal-domed grey flying saucer with yellow porthole
 * lights, a yellow tractor beam fanning down to the ground, and a little spotted
 * cow (peach head, grey-and-brown body, four black legs dangling) caught floating
 * inside the beam. The signature "I-know-it-but-can't-place-it" scene — everyone
 * pictures it, nobody knows where the beam starts. (114 squares.)
 */
const ufo = buildSprite([
  '.....TTT.....',
  '....TTTTT....',
  '...AAAAAAA...',
  '.AAAAAAAAAAA.',
  'AAAYAAYAAYAAA',
  '.AAAAAAAAAAA.',
  '...AAAAAAA...',
  '.....YYY.....',
  '....YYYYY....',
  '...YYYYYYY...',
  '..YYAMAAMAY..',
  '..YYSSAAAAY..',
  '.YYYKYKKYKYY.',
  'YYYYYYYYYYYYY',
]);
export const ufoSteps = ufo.steps;
export const ufoTarget = ufo.target;

/**
 * The axolotl: a derpy peach salamander seen head-on — two black dot eyes and a
 * tiny mouth, the signature feathery red gills fanning out each side of the head,
 * a chubby body with four little stub legs, and a tapering tail. Instantly
 * picture-able, impossible to know where to start. (108 squares.)
 */
const axolotl = buildSprite([
  '....SSSSS....',
  '...SSSSSSS...',
  '..RSSKSKSSR..',
  '.RRSSSSSSSRR.',
  '.RRSSSKSSSRR.',
  '..RSSSSSSSR..',
  '...SSSSSSS...',
  '.S.SSSSSSS.S.',
  '...SSSSSSS...',
  '..SSSSSSSSS..',
  '.S.SSSSSSS.S.',
  '...SSSSSSS...',
  '....SSSSS....',
  '.....SSS.....',
]);
export const axolotlSteps = axolotl.steps;
export const axolotlTarget = axolotl.target;
