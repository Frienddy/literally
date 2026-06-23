import { describe, it, expect } from 'vitest';
import { computeGridSpec } from '../../src/engine/grid';
import { pointToCell, cellCenter } from '../../src/engine/snap';
import { config } from '../../src/config';

const PAD = config.grid.pad; // default breathing room used when no pad is passed

/**
 * `computeGridSpec` is the single grid-layout helper shared by the live canvas,
 * the Mode 2 guidance overlay, and the dev harness (PRD-006 R06-10). It must
 * produce a centered, square-celled grid whose cell centers round-trip through the
 * pixel math, so every screen derives identical geometry.
 */
describe('computeGridSpec', () => {
  it('centers a square-celled grid in the available area', () => {
    const g = computeGridSpec(320, 400, 8, 10);
    // cols/rows count cells; the field spans exactly cols × rows cells.
    const spanX = g.cell * g.cols;
    const spanY = g.cell * g.rows;
    // Equal padding on opposite edges → centered.
    expect(g.originX).toBeCloseTo((320 - spanX) / 2);
    expect(g.originY).toBeCloseTo((400 - spanY) / 2);
    // Limiting dimension fits within the padded area.
    expect(spanY).toBeLessThanOrEqual(400 - PAD * 2 + 1e-9);
  });

  it('uses one square cell sized by the tighter axis', () => {
    const g = computeGridSpec(320, 400, 8, 10);
    const byW = (320 - PAD * 2) / 8;
    const byH = (400 - PAD * 2) / 10;
    expect(g.cell).toBeCloseTo(Math.min(byW, byH));
  });

  it('produces cell centers that map back to their own (col,row)', () => {
    const g = computeGridSpec(320, 400, 8, 10);
    for (const [col, row] of [
      [0, 0],
      [3, 5],
      [7, 9],
    ] as const) {
      expect(pointToCell(cellCenter({ col, row }, g), g)).toEqual({ col, row });
    }
  });
});
