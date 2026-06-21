import { describe, it, expect } from 'vitest';
import {
  clear,
  drawGrid,
  drawFreehand,
  drawGridDrawing,
  drawStepGuidance,
  drawTargetGhost,
} from '../../src/engine/render';
import type { GridSpec } from '../../src/engine/snap';
import type { FreehandDrawing, GridDrawing } from '../../src/types/session';
import { tokens } from '../../src/styles/tokens';

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

describe('drawFreehand', () => {
  it('skips strokes with fewer than 2 points and polylines the rest', () => {
    const d: FreehandDrawing = {
      kind: 'freehand',
      strokes: [
        { points: [{ x: 0, y: 0 }], width: 3 }, // skipped
        {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
          ],
          width: 3,
        },
      ],
      canvas: { width: 100, height: 100 },
    };
    const m = createMockCtx();
    drawFreehand(m.ctx, d);
    expect(m.calls.moveTo).toBe(1); // only the valid stroke
    expect(m.calls.lineTo).toBe(2); // points.length - 1
    expect(m.calls.stroke).toBe(1);
  });

  it('defaults to the committed ink but honours an override (DEBT-006)', () => {
    const d: FreehandDrawing = {
      kind: 'freehand',
      strokes: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 5, y: 5 },
          ],
          width: 3,
        },
      ],
      canvas: { width: 50, height: 50 },
    };

    const def = createMockCtx();
    drawFreehand(def.ctx, d);
    expect(def.ctx.strokeStyle).toBe(tokens.color.ink);

    // Mode 1 passes a distinct, legible storm ink for the dark canvas.
    const storm = createMockCtx();
    drawFreehand(storm.ctx, d, tokens.color.stormInk);
    expect(storm.ctx.strokeStyle).toBe(tokens.color.stormInk);
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

describe('drawStepGuidance', () => {
  const step = { from: { col: 1, row: 1 }, to: { col: 1, row: 5 } };

  it('ghosts the target (dashed) and pulses the start node', () => {
    const m = createMockCtx();
    drawStepGuidance(m.ctx, step, g, 0);
    // dash on for the ghost, then cleared before the node
    expect(m.calls.setLineDash).toBe(2);
    expect(m.calls.stroke).toBe(1); // ghost path
    expect(m.calls.arc).toBe(1); // pulsing node
    expect(m.calls.fill).toBe(1);
  });

  it('pulse radius varies with phase', () => {
    const radiusAt = (phase: number) => {
      const m = createMockCtx();
      drawStepGuidance(m.ctx, step, g, phase);
      const arc = m.log.find((c) => c.name === 'arc');
      return arc!.args[2];
    };
    expect(radiusAt(0.25)).not.toBeCloseTo(radiusAt(0.75), 5);
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
