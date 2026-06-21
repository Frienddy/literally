import { describe, it, expect } from 'vitest';
import {
  houseSteps,
  houseTarget,
  catSteps,
  catTarget,
  flowerSteps,
  flowerTarget,
} from '../../src/content/mode2.steps';
import { resolveTask, TASK_CONTENT } from '../../src/content/tasks';
import { config } from '../../src/config';
import type { GridNode } from '../../src/types/session';
import type { Mode2Step } from '../../src/content/mode2.steps';
import type { GridDrawing } from '../../src/types/session';

/**
 * The authored Mode 2 step sequences are the spine of the structured experience and
 * the hidden targets Reflection reveals (PRD-006 R06-9, PRD-009 R09-6/R09-7). These
 * guard that every subject stays literal, single-segment, in-bounds, and that its
 * target reproduces exactly what the steps draw.
 */
const key = (n: GridNode) => `${n.col},${n.row}`;

const SUBJECTS: Array<{ id: string; steps: Mode2Step[]; target: GridDrawing }> =
  [
    { id: 'house', steps: houseSteps, target: houseTarget },
    { id: 'cat', steps: catSteps, target: catTarget },
    { id: 'flower', steps: flowerSteps, target: flowerTarget },
  ];

describe.each(SUBJECTS)(
  '$id step sequence (PRD-009 R09-6/R09-7)',
  ({ steps, target }) => {
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
  },
);

describe('house geometry (PRD-006 R06-9)', () => {
  it('is a recognizable house in 9 single-segment steps', () => {
    expect(houseSteps).toHaveLength(9);
  });

  it('walls close into a loop and the roof + door meet the wall corners', () => {
    const s = houseSteps.map((step) => step.segment);
    for (let i = 0; i < 4; i++) {
      const next = s[(i + 1) % 4];
      expect(key(s[i].to)).toBe(key(next.from));
    }
    expect(key(s[4].from)).toBe(key(s[0].from)); // roof springs from top-left
    expect(key(s[4].to)).toBe(key(s[5].from)); // peak shared
    expect(key(s[5].to)).toBe(key(s[2].to)); // lands on top-right
    expect(key(s[6].to)).toBe(key(s[7].from)); // door is a connected inverted-U
    expect(key(s[7].to)).toBe(key(s[8].from));
    expect(s[6].from.row).toBe(8);
    expect(s[8].to.row).toBe(8);
  });
});

describe('cat + flower geometry (PRD-009 R09-7)', () => {
  it('the cat is a face square with two ears (8 steps; head closes)', () => {
    expect(catSteps).toHaveLength(8);
    const s = catSteps.map((step) => step.segment);
    for (let i = 0; i < 4; i++) {
      expect(key(s[i].to)).toBe(key(s[(i + 1) % 4].from)); // closed face loop
    }
    expect(key(s[4].from)).toBe(key(s[0].from)); // left ear from top-left corner
    expect(key(s[7].to)).toBe(key(s[2].to)); // right ear lands on top-right corner
  });

  it('the flower is a stem + closed diamond blossom + leaf (6 steps)', () => {
    expect(flowerSteps).toHaveLength(6);
    const s = flowerSteps.map((step) => step.segment);
    expect(key(s[0].to)).toBe(key(s[1].from)); // stem top feeds the blossom
    for (let i = 1; i <= 4; i++) {
      const next = i === 4 ? s[1] : s[i + 1];
      expect(key(s[i].to)).toBe(key(next.from)); // blossom is a closed diamond
    }
  });
});

describe('task resolver (PRD-009 §5, FR-20)', () => {
  it('resolves every subject to its own authored content (no fallback)', () => {
    expect(resolveTask('house').steps).toBe(houseSteps);
    expect(resolveTask('cat').steps).toBe(catSteps);
    expect(resolveTask('flower').steps).toBe(flowerSteps);
  });

  it('every pool subject is authored — none undefined (closes _debt/005)', () => {
    for (const id of ['house', 'cat', 'flower'] as const) {
      expect(TASK_CONTENT[id]).toBeDefined();
      expect(TASK_CONTENT[id].id).toBe(id);
      expect(TASK_CONTENT[id].vague.block.length).toBeGreaterThan(0);
    }
  });
});
