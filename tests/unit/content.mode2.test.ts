import { describe, it, expect } from 'vitest';
import {
  droidSteps,
  droidTarget,
  alienSteps,
  alienTarget,
  monsterSteps,
  monsterTarget,
  fighterSteps,
  fighterTarget,
} from '../../src/content/mode2.steps';
import { resolveTask, TASK_CONTENT } from '../../src/content/tasks';
import { config } from '../../src/config';
import type { GridNode } from '../../src/types/session';
import type { Mode2Step } from '../../src/content/mode2.steps';
import type { GridDrawing } from '../../src/types/session';

/**
 * The authored Mode 2 step sequences are the spine of the structured experience and
 * the hidden targets Reflection reveals (FR-20). These guard that every subject stays
 * literal, single-segment, in-bounds, and that its target reproduces exactly what the
 * steps draw.
 */
const key = (n: GridNode) => `${n.col},${n.row}`;

/** Assert steps[start..end] form a closed loop (each `to` feeds the next `from`). */
const expectClosedLoop = (steps: Mode2Step[], start: number, end: number) => {
  const s = steps.map((step) => step.segment);
  for (let i = start; i < end; i++) {
    expect(key(s[i].to)).toBe(key(s[i + 1].from));
  }
  expect(key(s[end].to)).toBe(key(s[start].from));
};

const SUBJECTS: Array<{ id: string; steps: Mode2Step[]; target: GridDrawing }> =
  [
    { id: 'droid', steps: droidSteps, target: droidTarget },
    { id: 'alien', steps: alienSteps, target: alienTarget },
    { id: 'monster', steps: monsterSteps, target: monsterTarget },
    { id: 'fighter', steps: fighterSteps, target: fighterTarget },
  ];

describe.each(SUBJECTS)('$id step sequence (FR-20)', ({ steps, target }) => {
  it('every step draws exactly one segment between two distinct in-bounds nodes', () => {
    for (const { segment } of steps) {
      for (const node of [segment.from, segment.to]) {
        expect(Number.isInteger(node.col)).toBe(true);
        expect(Number.isInteger(node.row)).toBe(true);
        expect(node.col).toBeGreaterThanOrEqual(0);
        expect(node.col).toBeLessThan(config.grid.cols);
        expect(node.row).toBeGreaterThanOrEqual(0);
        expect(node.row).toBeLessThan(config.grid.rows);
      }
      expect(key(segment.from)).not.toBe(key(segment.to));
    }
  });

  it('every step has non-empty literal instruction text', () => {
    for (const { text } of steps) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  it('the target is exactly the ordered step segments on the shared grid', () => {
    expect(target.kind).toBe('grid');
    expect(target.grid).toEqual({
      cols: config.grid.cols,
      rows: config.grid.rows,
    });
    expect(target.segments).toEqual(steps.map((s) => s.segment));
  });
});

describe('droid geometry (FR-20)', () => {
  it('is a detailed domed robot in 21 single-segment steps', () => {
    expect(droidSteps).toHaveLength(21);
  });

  it('dome+body, the eye lens, and the data port are each closed loops', () => {
    expectClosedLoop(droidSteps, 0, 5); // dome + body outline
    expectClosedLoop(droidSteps, 7, 10); // eye lens rectangle
    expectClosedLoop(droidSteps, 13, 16); // data port
  });
});

describe('alien geometry (FR-20)', () => {
  it('is a detailed blocky alien in 31 steps', () => {
    expect(alienSteps).toHaveLength(31);
  });

  it('body, both eyes, and both pupils are closed loops', () => {
    expectClosedLoop(alienSteps, 0, 3); // body box
    expectClosedLoop(alienSteps, 8, 11); // left eye
    expectClosedLoop(alienSteps, 12, 15); // right eye
    expectClosedLoop(alienSteps, 16, 19); // left pupil
    expectClosedLoop(alienSteps, 20, 23); // right pupil
  });
});

describe('monster geometry (FR-20)', () => {
  it('is a detailed square-headed monster in 32 steps', () => {
    expect(monsterSteps).toHaveLength(32);
  });

  it('head, both eyes, both pupils, and the Π-mouth are closed loops', () => {
    expectClosedLoop(monsterSteps, 0, 3); // head
    expectClosedLoop(monsterSteps, 8, 11); // left eye
    expectClosedLoop(monsterSteps, 12, 15); // right eye
    expectClosedLoop(monsterSteps, 16, 19); // left pupil
    expectClosedLoop(monsterSteps, 20, 23); // right pupil
    expectClosedLoop(monsterSteps, 24, 31); // mouth (8-segment Π)
  });
});

describe('fighter geometry (FR-20)', () => {
  it('is a detailed space fighter in 26 steps', () => {
    expect(fighterSteps).toHaveLength(26);
  });

  it('cockpit, window, and both wings are closed loops; struts spring from the cockpit', () => {
    expectClosedLoop(fighterSteps, 0, 3); // cockpit diamond
    expectClosedLoop(fighterSteps, 4, 7); // cockpit window diamond
    expectClosedLoop(fighterSteps, 9, 14); // left wing hexagon
    expectClosedLoop(fighterSteps, 18, 23); // right wing hexagon
    const s = fighterSteps.map((step) => step.segment);
    expect(key(s[8].from)).toBe(key(s[2].to)); // left strut from cockpit-left point
    expect(key(s[17].from)).toBe(key(s[0].to)); // right strut from cockpit-right point
  });
});

describe('task resolver (FR-20)', () => {
  it('resolves every subject to its own authored content', () => {
    expect(resolveTask('droid').steps).toBe(droidSteps);
    expect(resolveTask('alien').steps).toBe(alienSteps);
    expect(resolveTask('monster').steps).toBe(monsterSteps);
    expect(resolveTask('fighter').steps).toBe(fighterSteps);
  });

  it('every pool subject is authored — none undefined', () => {
    for (const id of ['droid', 'alien', 'monster', 'fighter'] as const) {
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
