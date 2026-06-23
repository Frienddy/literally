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
} from '../../src/content/mode2.steps';
import { resolveTask, TASK_CONTENT } from '../../src/content/tasks';
import { config } from '../../src/config';
import type { GridNode, PixelDrawing } from '../../src/types/session';
import type { Mode2Step } from '../../src/content/mode2.steps';

/**
 * The authored Mode 2 sprites are the spine of the structured experience and the
 * hidden targets Reflection reveals (FR-20). These guard that every subject stays
 * literal, one-square-per-step, in-bounds, painted from the real palette, and that
 * its target reproduces exactly the squares the steps fill.
 */
const key = (n: GridNode) => `${n.col},${n.row}`;
const PALETTE = new Set<string>(config.palette.map((c) => c.hex));

const SUBJECTS: Array<{
  id: string;
  steps: Mode2Step[];
  target: PixelDrawing;
}> = [
  { id: 'droid', steps: droidSteps, target: droidTarget },
  { id: 'alien', steps: alienSteps, target: alienTarget },
  { id: 'mario', steps: marioSteps, target: marioTarget },
  { id: 'fighter', steps: fighterSteps, target: fighterTarget },
  { id: 'monalisa', steps: monalisaSteps, target: monalisaTarget },
];

describe.each(SUBJECTS)('$id sprite (FR-20)', ({ steps, target }) => {
  it('every step fills one in-bounds cell with a palette color', () => {
    for (const { cell, color } of steps) {
      expect(Number.isInteger(cell.col)).toBe(true);
      expect(Number.isInteger(cell.row)).toBe(true);
      expect(cell.col).toBeGreaterThanOrEqual(0);
      expect(cell.col).toBeLessThan(config.grid.cols);
      expect(cell.row).toBeGreaterThanOrEqual(0);
      expect(cell.row).toBeLessThan(config.grid.rows);
      expect(PALETTE.has(color)).toBe(true);
    }
  });

  it('no two steps target the same cell', () => {
    const keys = steps.map((s) => key(s.cell));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every step has non-empty literal instruction text', () => {
    for (const { text } of steps) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  it('the target is exactly the ordered step cells on the shared grid', () => {
    expect(target.kind).toBe('pixel');
    expect(target.grid).toEqual({
      cols: config.grid.cols,
      rows: config.grid.rows,
    });
    expect(target.cells).toEqual(
      steps.map((s) => ({ col: s.cell.col, row: s.cell.row, color: s.color })),
    );
  });
});

describe('sprite sizes (FR-20)', () => {
  it('each subject builds its expected number of squares', () => {
    expect(droidSteps).toHaveLength(34);
    expect(alienSteps).toHaveLength(36);
    expect(marioSteps).toHaveLength(39);
    expect(fighterSteps).toHaveLength(26);
    expect(monalisaSteps).toHaveLength(50);
  });
});

describe('task resolver (FR-20)', () => {
  it('resolves every subject to its own authored content', () => {
    expect(resolveTask('droid').steps).toBe(droidSteps);
    expect(resolveTask('alien').steps).toBe(alienSteps);
    expect(resolveTask('mario').steps).toBe(marioSteps);
    expect(resolveTask('fighter').steps).toBe(fighterSteps);
    expect(resolveTask('monalisa').steps).toBe(monalisaSteps);
  });

  it('every pool subject is authored — none undefined', () => {
    for (const id of [
      'droid',
      'alien',
      'mario',
      'fighter',
      'monalisa',
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
