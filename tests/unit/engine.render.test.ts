import { describe, it, expect } from 'vitest';
import {
  clear,
  drawGrid,
  drawPixelDrawing,
  drawTargetHighlight,
  drawTargetGhost,
} from '../../src/engine/render';
import type { GridSpec } from '../../src/engine/snap';
import type { PixelDrawing } from '../../src/types/session';

/**
 * jsdom has no real 2D context, so we record calls against a minimal stub. This
 * is enough to assert the engine's drawing *commands* (counts, alpha, rect sizes).
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
    fillRect: record('fillRect'),
    strokeRect: record('strokeRect'),
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
  it('draws one gridline per cell boundary (the pixel paper)', () => {
    const m = createMockCtx();
    drawGrid(m.ctx, g);
    // (cols+1) vertical + (rows+1) horizontal lines, batched into one stroke.
    const lines = g.cols + 1 + (g.rows + 1);
    expect(m.calls.moveTo).toBe(lines);
    expect(m.calls.lineTo).toBe(lines);
    expect(m.calls.stroke).toBe(1);
  });
});

describe('drawPixelDrawing', () => {
  it('fills one rect per painted cell', () => {
    const d: PixelDrawing = {
      kind: 'pixel',
      cells: [
        { col: 0, row: 0, color: '#ef4444' },
        { col: 3, row: 4, color: '#3b82f6' },
      ],
      grid: { cols: 8, rows: 10 },
    };
    const m = createMockCtx();
    drawPixelDrawing(m.ctx, d, g);
    expect(m.calls.fillRect).toBe(2);
  });
});

describe('drawTargetHighlight', () => {
  const cell = { col: 1, row: 1 };

  it('draws a pulsing halo rect and a solid cell outline', () => {
    const m = createMockCtx();
    drawTargetHighlight(m.ctx, cell, g, 0);
    expect(m.calls.strokeRect).toBe(2); // halo + inner outline
  });

  it('halo size varies with phase', () => {
    const haloSizeAt = (phase: number) => {
      const m = createMockCtx();
      drawTargetHighlight(m.ctx, cell, g, phase);
      const halo = m.log.find((c) => c.name === 'strokeRect'); // first rect = halo
      return halo!.args[2]; // width
    };
    expect(haloSizeAt(0.25)).not.toBeCloseTo(haloSizeAt(0.75), 5);
  });
});

describe('drawTargetGhost', () => {
  it('renders the pixel drawing at reduced alpha', () => {
    const target: PixelDrawing = {
      kind: 'pixel',
      cells: [
        { col: 0, row: 0, color: '#22c55e' },
        { col: 1, row: 0, color: '#22c55e' },
      ],
      grid: { cols: 8, rows: 10 },
    };
    const m = createMockCtx();
    drawTargetGhost(m.ctx, target, g);
    expect(m.alphaSets).toContain(0.25); // faint
    expect(m.calls.fillRect).toBe(2); // one per ghosted cell
  });
});
