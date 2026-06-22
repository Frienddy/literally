/**
 * Refit-on-reflow regression (ADR-006, ADR-015).
 *
 * The drawing area resizes for reasons other than a viewport `resize` event —
 * most notably Mode 2 swapping a one-line step instruction for a two-line one,
 * which reflows the canvas's container. When that happens the screen recomputes
 * the grid for the new box, so the canvas backing store + `sizeRef` must refit to
 * match or the dots render into a stale-sized buffer and pointer math snaps to a
 * grid that no longer lines up with what's painted ("the canvas breaks").
 *
 * `useCanvas` guards `ResizeObserver` behind feature detection (jsdom lacks it),
 * so this test installs a controllable stub, drives a box change, and asserts the
 * backing store followed the new dimensions and the scene repainted.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCanvas } from '../../src/hooks/useCanvas';
import type { GridSpec } from '../../src/engine/snap';

function mockCtx() {
  const calls: Record<string, number> = {};
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
    arc: rec('arc'),
    fill: rec('fill'),
    setLineDash: rec('setLineDash'),
    setTransform: rec('setTransform'),
    fillStyle: '',
    strokeStyle: '',
    lineCap: '',
    lineJoin: '',
    lineWidth: 0,
    globalAlpha: 1,
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

let calls: Record<string, number>;
// A mutable rect the canvas reports, so the test can "reflow" the element.
let rect = { width: 200, height: 200 };
// Captured ResizeObserver callbacks so the test can fire a box change.
let observerCbs: ResizeObserverCallback[];

beforeEach(() => {
  const m = mockCtx();
  calls = m.calls;
  rect = { width: 200, height: 200 };
  observerCbs = [];

  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        width: rect.width,
        height: rect.height,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: rect.width,
        bottom: rect.height,
        toJSON: () => ({}),
      }) as DOMRect,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    m.ctx as unknown as CanvasRenderingContext2D,
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: ResizeObserverCallback) {
        observerCbs.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  // Paint synchronously so the off-React rAF path is observable.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const grid: GridSpec = { cols: 8, rows: 8, cell: 20, originX: 20, originY: 20 };

describe('useCanvas — refits the backing store on element reflow', () => {
  it('resizes canvas.width/height when its box changes (no window resize)', () => {
    function Host() {
      const { setCanvas } = useCanvas({ grid });
      return <canvas ref={setCanvas} data-testid="cv" />;
    }
    render(<Host />);
    const cv = screen.getByTestId('cv') as HTMLCanvasElement;

    // Fit on attach (devicePixelRatio is undefined in jsdom → 1).
    expect(cv.width).toBe(200);
    expect(cv.height).toBe(200);
    const paintsBefore = calls.clearRect ?? 0;

    // The instruction card shrank by a line → the drawing area is shorter.
    rect = { width: 200, height: 120 };
    expect(observerCbs.length).toBeGreaterThan(0);
    observerCbs.forEach((cb) =>
      cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver),
    );

    // Backing store followed the new box, and the scene repainted.
    expect(cv.width).toBe(200);
    expect(cv.height).toBe(120);
    expect(calls.clearRect ?? 0).toBeGreaterThan(paintsBefore);
  });
});
