import { describe, it, expect } from 'vitest';
import {
  cellOrigin,
  cellCenter,
  pointToCell,
  clampToCell,
  type GridSpec,
} from '../../src/engine/snap';

const g: GridSpec = {
  cols: 8,
  rows: 10,
  cell: 40,
  originX: 20,
  originY: 20,
};

describe('cellOrigin', () => {
  it('maps a cell to its top-left pixel corner', () => {
    expect(cellOrigin({ col: 0, row: 0 }, g)).toEqual({ x: 20, y: 20 });
    expect(cellOrigin({ col: 2, row: 3 }, g)).toEqual({ x: 100, y: 140 });
  });
});

describe('cellCenter', () => {
  it('maps a cell to its pixel center', () => {
    expect(cellCenter({ col: 0, row: 0 }, g)).toEqual({ x: 40, y: 40 });
    expect(cellCenter({ col: 2, row: 3 }, g)).toEqual({ x: 120, y: 160 });
  });
});

describe('pointToCell', () => {
  it('returns the cell a pointer falls in (anywhere inside it)', () => {
    expect(pointToCell({ x: 20, y: 20 }, g)).toEqual({ col: 0, row: 0 });
    expect(pointToCell({ x: 59, y: 59 }, g)).toEqual({ col: 0, row: 0 });
    expect(pointToCell({ x: 61, y: 61 }, g)).toEqual({ col: 1, row: 1 });
    expect(pointToCell({ x: 105, y: 145 }, g)).toEqual({ col: 2, row: 3 });
  });

  it('returns null when the pointer is outside the cell field', () => {
    expect(pointToCell({ x: -1, y: 50 }, g)).toBeNull();
    expect(pointToCell({ x: 50, y: 19 }, g)).toBeNull();
    // origin + cols*cell = 340 (and rows: 420) sit one past the last cell.
    expect(pointToCell({ x: 340, y: 50 }, g)).toBeNull();
    expect(pointToCell({ x: 50, y: 420 }, g)).toBeNull();
  });

  it('round-trips: cellCenter → pointToCell returns the same cell', () => {
    for (let c = 0; c < g.cols; c++) {
      for (let r = 0; r < g.rows; r++) {
        const cell = { col: c, row: r };
        expect(pointToCell(cellCenter(cell, g), g)).toEqual(cell);
      }
    }
  });
});

describe('clampToCell', () => {
  it('clamps out-of-bounds pointers to the nearest edge cell', () => {
    expect(clampToCell({ x: -1000, y: -1000 }, g)).toEqual({ col: 0, row: 0 });
    expect(clampToCell({ x: 99999, y: 99999 }, g)).toEqual({
      col: g.cols - 1,
      row: g.rows - 1,
    });
  });
});
