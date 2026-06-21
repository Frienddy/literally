/**
 * The zero-latency invariant (PRD-011 R11-7, ADR-006, _docs/04 §3).
 *
 * During a stroke, points accumulate in refs inside `useCanvas` and paint via
 * requestAnimationFrame. React must NOT re-render per pointer event — the store
 * is touched only once, when the stroke/segment finishes (`onChange`). This test
 * stands in for the manual profiler check in R11-7: it counts React renders of a
 * component that hosts `useCanvas` while driving a full native-pointer stroke,
 * and asserts the count never moves mid-stroke.
 *
 * The pointer handlers are attached with addEventListener (native events, not
 * React synthetic), so we dispatch real Events on the canvas element. rAF is
 * stubbed to run synchronously so the off-React paint path is observable.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import { useCanvas, defaultWobble } from '../../src/hooks/useCanvas';
import type { GridSpec } from '../../src/engine/snap';

/** Records the 2D commands the engine issues (jsdom has no real ctx). */
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
    scale: rec('scale'),
    translate: rec('translate'),
    fillStyle: '',
    strokeStyle: '',
    lineCap: '',
    lineJoin: '',
    lineWidth: 0,
    globalAlpha: 1,
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

/** A pointer event jsdom will accept (no PointerEvent ctor needed). */
function pointer(type: string, x: number, y: number): Event {
  const e = new Event(type, { bubbles: true, cancelable: true });
  return Object.assign(e, { clientX: x, clientY: y, pointerId: 1 });
}

let calls: Record<string, number>;
const origSetCapture = HTMLElement.prototype.setPointerCapture;
const origReleaseCapture = HTMLElement.prototype.releasePointerCapture;

beforeEach(() => {
  const m = mockCtx();
  calls = m.calls;
  // A real, sized canvas surface.
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
  // jsdom lacks pointer-capture; the hook calls it on down/up.
  HTMLElement.prototype.setPointerCapture = () => {};
  HTMLElement.prototype.releasePointerCapture = () => {};
  // Paint synchronously so the off-React rAF path is observable + deterministic.
  // Return 0 (not a real handle) so useCanvas's rafRef guard stays open and every
  // scheduleRender paints, rather than coalescing into the first frame.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  HTMLElement.prototype.setPointerCapture = origSetCapture;
  HTMLElement.prototype.releasePointerCapture = origReleaseCapture;
});

describe('useCanvas — refs-not-state during a stroke (ADR-006)', () => {
  it('does not re-render React across a 40-point freehand stroke', () => {
    let renders = 0;
    const onChange = vi.fn();
    function Host() {
      renders++;
      const { setCanvas } = useCanvas({
        mode: 'freehand',
        wobble: defaultWobble,
        onChange,
      });
      return <canvas ref={setCanvas} data-testid="cv" />;
    }

    render(<Host />);
    const cv = screen.getByTestId('cv');
    const baseline = renders; // one mount render

    act(() => cv.dispatchEvent(pointer('pointerdown', 10, 10)));
    for (let i = 1; i <= 40; i++) {
      act(() => cv.dispatchEvent(pointer('pointermove', 10 + i * 4, 10 + i)));
      expect(renders).toBe(baseline); // never mid-stroke
    }
    act(() => cv.dispatchEvent(pointer('pointerup', 180, 60)));

    // React stayed put through the whole stroke...
    expect(renders).toBe(baseline);
    // ...the store was touched exactly once, on completion...
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ kind: 'freehand' });
    // ...and the scene still painted off the React path (rAF → ctx).
    expect(calls.clearRect).toBeGreaterThan(0);
    expect(calls.stroke).toBeGreaterThan(0);
  });

  it('re-renders at most once when stroke-end writes to state, never mid-stroke', () => {
    let renders = 0;
    function Host() {
      renders++;
      const [, setDrawing] = useState<unknown>(null);
      const { setCanvas } = useCanvas({
        mode: 'freehand',
        wobble: defaultWobble,
        onChange: (d) => setDrawing(d), // realistic: stroke-end hits React state
      });
      return <canvas ref={setCanvas} data-testid="cv" />;
    }

    render(<Host />);
    const cv = screen.getByTestId('cv');
    const baseline = renders;

    act(() => cv.dispatchEvent(pointer('pointerdown', 10, 10)));
    for (let i = 1; i <= 30; i++) {
      act(() => cv.dispatchEvent(pointer('pointermove', 10 + i * 4, 10 + i)));
    }
    expect(renders).toBe(baseline); // no re-render during the stroke

    act(() => cv.dispatchEvent(pointer('pointerup', 130, 40)));
    expect(renders).toBe(baseline + 1); // exactly one, on stroke end
  });

  it('does not re-render React while dragging a grid segment (Mode 2)', () => {
    let renders = 0;
    const onChange = vi.fn();
    const onHaptic = vi.fn();
    const grid: GridSpec = {
      cols: 8,
      rows: 8,
      cell: 20,
      originX: 20,
      originY: 20,
    };
    function Host() {
      renders++;
      const { setCanvas } = useCanvas({
        mode: 'grid',
        grid,
        onChange,
        onHaptic,
      });
      return <canvas ref={setCanvas} data-testid="cv" />;
    }

    render(<Host />);
    const cv = screen.getByTestId('cv');
    const baseline = renders;

    // Drag from node (0,0)≈(20,20) toward (4,4)≈(100,100).
    drawStrokeGrid(cv, () => expect(renders).toBe(baseline));

    expect(renders).toBe(baseline);
    expect(onChange).toHaveBeenCalledTimes(1); // one committed segment
    expect(onChange.mock.calls[0][0]).toMatchObject({ kind: 'grid' });
  });
});

/** Drag node→node across the grid, asserting `mid` after every move. */
function drawStrokeGrid(el: HTMLElement, mid: () => void) {
  act(() => el.dispatchEvent(pointer('pointerdown', 20, 20)));
  for (let i = 1; i <= 8; i++) {
    act(() =>
      el.dispatchEvent(pointer('pointermove', 20 + i * 10, 20 + i * 10)),
    );
    mid();
  }
  act(() => el.dispatchEvent(pointer('pointerup', 100, 100)));
}
