import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DrawingPreview } from '../../src/components/DrawingPreview';
import { TargetReveal } from '../../src/components/TargetReveal';
import type { PixelDrawing } from '../../src/types/session';

const grid: PixelDrawing = {
  kind: 'pixel',
  cells: [
    { col: 0, row: 0, color: '#22c55e' },
    { col: 0, row: 4, color: '#22c55e' },
    { col: 4, row: 4, color: '#22c55e' },
  ],
  grid: { cols: 8, rows: 10 },
};

// A Mode 1 attempt — both modes paint on the shared pixel grid now (ADR-015).
const attempt: PixelDrawing = {
  kind: 'pixel',
  cells: [
    { col: 1, row: 1, color: '#ef4444' },
    { col: 3, row: 5, color: '#ef4444' },
  ],
  grid: { cols: 8, rows: 10 },
};

/** Records the 2D drawing commands the engine issues (jsdom has no real ctx). */
function mockCtx() {
  const calls: Record<string, number> = {};
  const alphaSets: number[] = [];
  let alpha = 1;
  const rec =
    (name: string) =>
    (..._args: unknown[]) => {
      calls[name] = (calls[name] ?? 0) + 1;
    };
  const ctx = {
    clearRect: rec('clearRect'),
    save: rec('save'),
    restore: rec('restore'),
    beginPath: rec('beginPath'),
    moveTo: rec('moveTo'),
    lineTo: rec('lineTo'),
    stroke: rec('stroke'),
    fillRect: rec('fillRect'),
    strokeRect: rec('strokeRect'),
    arc: rec('arc'),
    fill: rec('fill'),
    setLineDash: rec('setLineDash'),
    setTransform: rec('setTransform'),
    scale: rec('scale'),
    translate: rec('translate'),
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
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls, alphaSets };
}

/** Give the preview box a real size + a recording 2D context. */
function withCanvas() {
  const m = mockCtx();
  const rect = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({
      width: 200,
      height: 200,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 200,
      bottom: 200,
      toJSON: () => ({}),
    } as DOMRect);
  const getCtx = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(m.ctx as unknown as CanvasRenderingContext2D);
  return { m, rect, getCtx };
}

afterEach(() => vi.restoreAllMocks());

describe('DrawingPreview (PRD-008 R08-2)', () => {
  it('exposes the drawing as a labelled image even without a 2D context', () => {
    render(<DrawingPreview drawing={grid} label="your pixel house" />);
    const img = screen.getByRole('img', { name: 'your pixel house' });
    expect(img.tagName).toBe('CANVAS');
  });

  it('fills one rect per painted cell via the shared engine', () => {
    const { m } = withCanvas();
    render(<DrawingPreview drawing={grid} label="pixels" />);
    expect(m.calls.fillRect).toBe(grid.cells.length);
    expect(m.calls.clearRect).toBeGreaterThan(0);
  });

  it('ghosts a target faintly behind the drawing (R08-3)', () => {
    const { m } = withCanvas();
    render(<DrawingPreview drawing={attempt} ghostTarget={grid} label="m1" />);
    expect(m.alphaSets).toContain(0.25); // the faint target ghost
    // ghost (one fill per cell) + the attempt's cells on top
    expect(m.calls.fillRect).toBe(grid.cells.length + attempt.cells.length);
  });
});

describe('TargetReveal (PRD-008 R08-3/R08-13)', () => {
  it('renders the heading + the target preview image', () => {
    render(
      <TargetReveal
        target={grid}
        heading="What you were asked for"
        label="the intended house"
      />,
    );
    expect(screen.getByText('What you were asked for')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'the intended house' }),
    ).toBeInTheDocument();
  });
});
