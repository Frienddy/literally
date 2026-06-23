import { describe, it, expect } from 'vitest';
import {
  droidSteps,
  droidTarget,
  alienSteps,
  alienTarget,
  marioSteps,
  marioTarget,
  fighterSteps,
  fighterTarget,
  monalisaSteps,
  monalisaTarget,
  ufoSteps,
  ufoTarget,
  axolotlSteps,
  axolotlTarget,
} from '../../src/content/mode2.steps';
import { resolveTask, TASK_CONTENT } from '../../src/content/tasks';
import { config } from '../../src/config';
import type { GridNode, PixelDrawing } from '../../src/types/session';
import type { Mode2Step } from '../../src/content/mode2.steps';

/**
 * The authored Mode 2 sprites are the spine of the structured experience and the
 * hidden targets Reflection reveals (FR-20). Steps are now coordinate-based
 * **runs**: each fills a contiguous, in-bounds, same-color horizontal strip with a
 * numbered palette color, the step text names those coordinates, and the target
 * reproduces exactly the squares the runs fill, in order.
 */
const key = (n: GridNode) => `${n.col},${n.row}`;
const PALETTE = new Set<string>(config.palette.map((c) => c.hex));
const NAME_TO_HEX = new Map<string, string>(
  config.palette.map((c) => [c.name, c.hex]),
);
const NAME_TO_INDEX = new Map<string, number>(
  config.palette.map((c, i) => [c.name, i + 1]),
);

const SUBJECTS: Array<{
  id: string;
  steps: Mode2Step[];
  target: PixelDrawing;
  cellCount: number;
}> = [
  { id: 'droid', steps: droidSteps, target: droidTarget, cellCount: 73 },
  { id: 'alien', steps: alienSteps, target: alienTarget, cellCount: 36 },
  { id: 'mario', steps: marioSteps, target: marioTarget, cellCount: 118 },
  { id: 'fighter', steps: fighterSteps, target: fighterTarget, cellCount: 26 },
  {
    id: 'monalisa',
    steps: monalisaSteps,
    target: monalisaTarget,
    cellCount: 172,
  },
  { id: 'ufo', steps: ufoSteps, target: ufoTarget, cellCount: 114 },
  {
    id: 'axolotl',
    steps: axolotlSteps,
    target: axolotlTarget,
    cellCount: 108,
  },
];

describe.each(SUBJECTS)(
  '$id sprite (FR-20)',
  ({ steps, target, cellCount }) => {
    it('every run is a contiguous, in-bounds, same-color horizontal strip', () => {
      for (const s of steps) {
        expect(s.length).toBeGreaterThanOrEqual(1);
        expect(s.cells).toHaveLength(s.length);
        // The run starts at `start` and walks right one cell at a time, same row.
        s.cells.forEach((c, i) => {
          expect(c.row).toBe(s.start.row);
          expect(c.col).toBe(s.start.col + i);
          expect(Number.isInteger(c.col)).toBe(true);
          expect(c.col).toBeGreaterThanOrEqual(0);
          expect(c.col).toBeLessThan(config.grid.cols);
          expect(c.row).toBeGreaterThanOrEqual(0);
          expect(c.row).toBeLessThan(config.grid.rows);
        });
        // Color is from the real palette, and the number/name agree with it.
        expect(PALETTE.has(s.color)).toBe(true);
        expect(NAME_TO_HEX.get(s.colorName)).toBe(s.color);
        expect(s.colorIndex).toBe(NAME_TO_INDEX.get(s.colorName));
      }
    });

    it('no two runs overlap a cell', () => {
      const keys = steps.flatMap((s) => s.cells.map(key));
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('the runs cover exactly the subject’s square count', () => {
      const filled = steps.reduce((sum, s) => sum + s.length, 0);
      expect(filled).toBe(cellCount);
    });

    it('every step has literal text naming its row, col and numbered color', () => {
      for (const s of steps) {
        expect(s.text.trim().length).toBeGreaterThan(0);
        expect(s.text).toContain(`row ${s.start.row + 1}`);
        expect(s.text).toContain(`col ${s.start.col + 1}`);
        expect(s.text).toContain(`color ${s.colorIndex}`);
        expect(s.text).toContain(s.colorName);
      }
    });

    it('the target is exactly the ordered run cells on the shared grid', () => {
      expect(target.kind).toBe('pixel');
      expect(target.grid).toEqual({
        cols: config.grid.cols,
        rows: config.grid.rows,
      });
      expect(target.cells).toEqual(
        steps.flatMap((s) =>
          s.cells.map((c) => ({ col: c.col, row: c.row, color: s.color })),
        ),
      );
    });
  },
);

describe('sprite sizes (FR-20)', () => {
  it('run-length encoding compresses each subject into fewer steps than squares', () => {
    for (const { steps, cellCount } of SUBJECTS) {
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.length).toBeLessThan(cellCount); // runs batch adjacent same-color cells
    }
  });
});

describe('task resolver (FR-20)', () => {
  it('resolves every subject to its own authored content', () => {
    expect(resolveTask('droid').steps).toBe(droidSteps);
    expect(resolveTask('alien').steps).toBe(alienSteps);
    expect(resolveTask('mario').steps).toBe(marioSteps);
    expect(resolveTask('fighter').steps).toBe(fighterSteps);
    expect(resolveTask('monalisa').steps).toBe(monalisaSteps);
    expect(resolveTask('ufo').steps).toBe(ufoSteps);
    expect(resolveTask('axolotl').steps).toBe(axolotlSteps);
  });

  it('every pool subject is authored — none undefined', () => {
    for (const id of [
      'droid',
      'alien',
      'mario',
      'fighter',
      'monalisa',
      'ufo',
      'axolotl',
    ] as const) {
      expect(TASK_CONTENT[id]).toBeDefined();
      expect(TASK_CONTENT[id].id).toBe(id);
      expect(TASK_CONTENT[id].vague.block.length).toBeGreaterThan(0);
    }
  });

  it('falls back to a pool subject for an unknown / legacy id (no crash)', () => {
    expect(resolveTask('house')).toBe(TASK_CONTENT.droid);
    expect(resolveTask('totally-unknown')).toBe(TASK_CONTENT.droid);
  });
});
