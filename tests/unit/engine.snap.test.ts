import { describe, it, expect } from 'vitest';
import {
  nodeToPixel,
  snapToNode,
  isWithinSnap,
  type GridSpec,
} from '../../src/engine/snap';

const g: GridSpec = {
  cols: 8,
  rows: 10,
  cell: 40,
  originX: 20,
  originY: 20,
};

describe('nodeToPixel', () => {
  it('maps a node to its pixel center', () => {
    expect(nodeToPixel({ col: 0, row: 0 }, g)).toEqual({ x: 20, y: 20 });
    expect(nodeToPixel({ col: 2, row: 3 }, g)).toEqual({ x: 100, y: 140 });
  });
});

describe('snapToNode', () => {
  it('snaps to the nearest node', () => {
    // Just past the (1,1) center (60,60): a small offset still rounds to (1,1).
    expect(snapToNode({ x: 66, y: 54 }, g)).toEqual({ col: 1, row: 1 });
    // Halfway between (1,*) and (2,*) rounds up to col 2.
    expect(snapToNode({ x: 80, y: 20 }, g)).toEqual({ col: 2, row: 0 });
  });

  it('clamps out-of-bounds pointers to the grid edges', () => {
    expect(snapToNode({ x: -1000, y: -1000 }, g)).toEqual({ col: 0, row: 0 });
    expect(snapToNode({ x: 99999, y: 99999 }, g)).toEqual({
      col: g.cols - 1,
      row: g.rows - 1,
    });
  });

  it('round-trips: nodeToPixel → snapToNode returns the same node', () => {
    for (let c = 0; c < g.cols; c++) {
      for (let r = 0; r < g.rows; r++) {
        const node = { col: c, row: r };
        expect(snapToNode(nodeToPixel(node, g), g)).toEqual(node);
      }
    }
  });
});

describe('isWithinSnap', () => {
  it('is true exactly on a node center', () => {
    expect(isWithinSnap({ x: 60, y: 60 }, g)).toBe(true);
  });

  it('is false when the pointer is outside the tolerance radius', () => {
    // default tolerance = cell * 0.4 = 16px; 19px away from (60,60) is outside.
    expect(isWithinSnap({ x: 79, y: 60 }, g)).toBe(false);
  });

  it('honors a custom tolerance', () => {
    expect(isWithinSnap({ x: 75, y: 60 }, g, 20)).toBe(true);
    expect(isWithinSnap({ x: 75, y: 60 }, g, 5)).toBe(false);
  });
});
