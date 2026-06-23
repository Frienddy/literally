/**
 * StrictMode repaint regression (ADR-006).
 *
 * `scheduleRender` coalesces paints behind a single rAF handle in `rafRef` and
 * skips scheduling while one is pending. The unmount cleanup cancels the pending
 * frame — and must also clear the handle, or the guard stays armed forever. Under
 * React StrictMode (dev) the mount→unmount→remount cycle reuses the same refs, so
 * a frame scheduled on the first mount is canceled on the strict unmount; if the
 * handle isn't reset, every post-remount `scheduleRender` no-ops and the canvas is
 * cleared by `fitToDpr` but never repainted — a permanently blank cell grid.
 *
 * This drives that exact cycle with a *deferred* rAF queue (frames run only when
 * flushed, so a cancel can land while one is pending) and asserts the grid still
 * paints (clearRect + the gridline `stroke`) after the strict remount.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, act } from '@testing-library/react';
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
// Deferred rAF: frames queue and run only on flush, so a cancel can land while a
// frame is still pending (the condition that wedges the guard).
let rafQueue: Array<[number, FrameRequestCallback]>;
let nextRafId: number;
const flushRaf = () => {
  const q = rafQueue;
  rafQueue = [];
  q.forEach(([, cb]) => cb(0));
};

beforeEach(() => {
  const m = mockCtx();
  calls = m.calls;
  rafQueue = [];
  nextRafId = 0;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
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
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    m.ctx as unknown as CanvasRenderingContext2D,
  );
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    nextRafId += 1; // ids are non-zero so the rafRef guard treats them as pending
    rafQueue.push([nextRafId, cb]);
    return nextRafId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafQueue = rafQueue.filter(([qid]) => qid !== id);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const grid: GridSpec = { cols: 8, rows: 8, cell: 20, originX: 20, originY: 20 };

describe('useCanvas — repaints after a StrictMode remount', () => {
  it('paints the grid (the rAF handle is cleared on cancel, not wedged)', () => {
    function Host() {
      const { setCanvas } = useCanvas({ grid });
      return <canvas ref={setCanvas} data-testid="cv" />;
    }
    render(
      <StrictMode>
        <Host />
      </StrictMode>,
    );
    expect(screen.getByTestId('cv')).toBeInTheDocument();

    // Run whatever frame survived the strict mount→unmount→remount cycle.
    act(() => flushRaf());
    act(() => flushRaf()); // drain any follow-up scheduled during the first flush

    // With the handle wedged, no frame is ever queued post-remount and these stay
    // 0; with the fix the grid (cell gridlines = stroke) paints.
    expect(calls.clearRect ?? 0).toBeGreaterThan(0);
    expect(calls.stroke ?? 0).toBeGreaterThan(0);
  });
});
