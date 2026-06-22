import { describe, it, expect } from 'vitest';
import {
  clear,
  drawGrid,
  drawGridDrawing,
  drawStartHighlight,
  drawTargetGhost,
} from '../../src/engine/render';
import type { GridSpec } from '../../src/engine/snap';
import type { GridDrawing } from '../../src/types/session';

/**
 * jsdom has no real 2D context, so we record calls against a minimal stub. This
 * is enough to assert the engine's drawing *commands* (counts, alpha, dashes).
 */
function createMockCtx() {
  const calls: Record<string, number> = {};
  const log: Array<{ name: string; args: number[] }> = [];
  const alphaSets: number[] = [];
  let alpha = 1;

  const record =
    (name: string) =>
    (...args: number[]) => {
      calls[name] = (calls[name] ?? 0) + 1;
      log.push({ name, args });
    };

  const ctx = {
    clearRect: record('clearRect'),
    save: record('save'),
    restore: record('restore'),
    beginPath: record('beginPath'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    stroke: record('stroke'),
    arc: record('arc'),
    fill: record('fill'),
    setLineDash: record('setLineDash'),
    fillStyle: '',
    strokeStyle: '',
    lineCap: '',
    lineJoin: '',
    lineWidth: 0,
  };
  Object.defineProperty(ctx, 'globalAlpha', {
    get: () => alpha,
    set: (v: number) => {
      alpha = v;
      alphaSets.push(v);
    },
  });

  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    calls,
    log,
    alphaSets,
  };
}

const g: GridSpec = { cols: 8, rows: 10, cell: 40, originX: 20, originY: 20 };

describe('clear', () => {
  it('clears the full canvas rect', () => {
    const m = createMockCtx();
    clear(m.ctx, 320, 480);
    expect(m.log).toContainEqual({ name: 'clearRect', args: [0, 0, 320, 480] });
  });
});

describe('drawGrid', () => {
  it('draws one node dot per grid intersection', () => {
    const m = createMockCtx();
    drawGrid(m.ctx, g);
    expect(m.calls.arc).toBe(g.cols * g.rows);
    expect(m.calls.fill).toBe(g.cols * g.rows);
  });
});

describe('drawGridDrawing', () => {
  it('strokes one line per segment', () => {
    const d: GridDrawing = {
      kind: 'grid',
      segments: [
        { from: { col: 0, row: 0 }, to: { col: 0, row: 4 } },
        { from: { col: 0, row: 4 }, to: { col: 3, row: 4 } },
      ],
      grid: { cols: 8, rows: 10 },
    };
    const m = createMockCtx();
    drawGridDrawing(m.ctx, d, g);
    expect(m.calls.moveTo).toBe(2);
    expect(m.calls.lineTo).toBe(2);
    expect(m.calls.stroke).toBe(2);
  });
});

describe('drawStartHighlight', () => {
  const node = { col: 1, row: 1 };

  it('draws a pulsing halo ring and a solid anchor dot', () => {
    const m = createMockCtx();
    drawStartHighlight(m.ctx, node, g, 0);
    expect(m.calls.arc).toBe(2); // halo ring + center dot
    expect(m.calls.stroke).toBe(1); // the halo ring
    expect(m.calls.fill).toBe(1); // the anchor dot
  });

  it('halo radius varies with phase', () => {
    const haloRadiusAt = (phase: number) => {
      const m = createMockCtx();
      drawStartHighlight(m.ctx, node, g, phase);
      const halo = m.log.find((c) => c.name === 'arc'); // first arc is the ring
      return halo!.args[2];
    };
    expect(haloRadiusAt(0.25)).not.toBeCloseTo(haloRadiusAt(0.75), 5);
  });
});

describe('drawTargetGhost', () => {
  it('renders the grid drawing at reduced alpha', () => {
    const target: GridDrawing = {
      kind: 'grid',
      segments: [{ from: { col: 0, row: 0 }, to: { col: 2, row: 0 } }],
      grid: { cols: 8, rows: 10 },
    };
    const m = createMockCtx();
    drawTargetGhost(m.ctx, target, g);
    expect(m.alphaSets).toContain(0.22); // faint
    expect(m.calls.stroke).toBe(1); // the single target segment
  });
});
