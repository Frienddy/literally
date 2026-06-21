import { describe, it, expect } from 'vitest';
import { houseSteps, houseTarget } from '../../src/content/mode2.steps';
import { resolveTask, TASK_CONTENT } from '../../src/content/tasks';
import { config } from '../../src/config';
import type { GridNode } from '../../src/types/session';

/**
 * The authored Mode 2 step sequence is the spine of the structured experience and
 * the hidden target Reflection reveals (PRD-006 R06-9). These guard that it stays
 * literal, single-segment, in-bounds, and geometrically coherent so guidance ghosts
 * exactly one move per card and the target reproduces what the steps draw.
 */
const key = (n: GridNode) => `${n.col},${n.row}`;

describe('house step sequence (PRD-006 R06-9)', () => {
  it('is a recognizable house in ~8 single-segment steps', () => {
    expect(houseSteps).toHaveLength(9);
  });

  it('every step draws exactly one segment between two distinct in-bounds nodes', () => {
    for (const { segment } of houseSteps) {
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

  it('the target is exactly the ordered step segments on the shared grid', () => {
    expect(houseTarget.kind).toBe('grid');
    expect(houseTarget.grid).toEqual({
      cols: config.grid.cols,
      rows: config.grid.rows,
    });
    expect(houseTarget.segments).toEqual(houseSteps.map((s) => s.segment));
  });

  it('walls close into a loop and the roof + door meet the wall corners', () => {
    const s = houseSteps.map((step) => step.segment);
    // Walls (0–3) form a closed 4-segment loop.
    for (let i = 0; i < 4; i++) {
      const next = s[(i + 1) % 4];
      expect(key(s[i].to)).toBe(key(next.from));
    }
    // Roof springs from the top-left corner and lands on the top-right corner.
    expect(key(s[4].from)).toBe(key(s[0].from)); // top-left wall corner
    expect(key(s[4].to)).toBe(key(s[5].from)); // peak is shared
    expect(key(s[5].to)).toBe(key(s[2].to)); // top-right wall corner
    // Door is a connected inverted-U whose feet sit on the floor row (row 8).
    expect(key(s[6].to)).toBe(key(s[7].from));
    expect(key(s[7].to)).toBe(key(s[8].from));
    expect(s[6].from.row).toBe(8);
    expect(s[8].to.row).toBe(8);
  });
});

describe('task resolver (PRD-006 §5, FR-20)', () => {
  it('resolves the authored house subject', () => {
    expect(resolveTask('house').id).toBe('house');
    expect(resolveTask('house').steps).toBe(houseSteps);
  });

  it('falls back to the house for not-yet-authored subjects (PRD-009)', () => {
    expect(TASK_CONTENT.cat).toBeUndefined();
    expect(TASK_CONTENT.flower).toBeUndefined();
    expect(resolveTask('cat').id).toBe('house');
    expect(resolveTask('flower').target).toBe(houseTarget);
  });
});
