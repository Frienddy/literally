/**
 * useCanvas (PRD-003 R03-6…R03-14, _docs/04 §3).
 *
 * The shared snap-to-grid drawing surface for **both** modes (ADR-015): pointer
 * moves snap to the nearest dot and each finished drag commits exactly one
 * segment between grid nodes. The canvas is an imperative island (ADR-006): live
 * pointer state accumulates in refs and renders on `requestAnimationFrame`; React
 * never re-renders during a drag. The store is touched only via `onChange`, once
 * per finished segment (or undo/reset).
 *
 * Reconciliation vs _docs/04 §3 reference (no ADR change): the pointer handlers
 * are stable (`useCallback` with stable deps) and read the latest options from
 * `optsRef`, instead of closing over `opts` directly. The reference attaches the
 * listeners once in `setCanvas` but its handlers close over `onChange`/`onHaptic`
 * — so an inline `onChange` from a screen would go stale. Reading through a ref
 * keeps callbacks fresh without re-binding listeners. `undo`/`reset` also emit
 * `onChange` so the persisted drawing stays in sync with what's on screen.
 */
import { useCallback, useEffect, useRef } from 'react';
import type {
  GridDrawing,
  GridSegment,
  GridNode,
  Point,
} from '../types/session';
import {
  snapToNode,
  isWithinSnap,
  nodeToPixel,
  type GridSpec,
} from '../engine/snap';
import { clear, drawGrid, drawGridDrawing } from '../engine/render';
import type { HapticKind } from './useHaptics';

export interface UseCanvasOptions {
  /** The grid the canvas snaps to (omit until measured; the hook no-ops). */
  grid?: GridSpec;
  /** Called once per movement that produces haptic-worthy feedback. */
  onHaptic?: (kind: HapticKind) => void;
  /** Called when a segment finishes (or undo/reset), with the full drawing. */
  onChange?: (drawing: GridDrawing) => void;
}

export interface UseCanvasApi {
  /** Ref callback for the `<canvas>` element. */
  setCanvas: (el: HTMLCanvasElement | null) => void;
  /** Remove the last committed segment. */
  undo: () => void;
  /** Clear all segments. */
  reset: () => void;
}

const nodeKey = (n: GridNode): string => `${n.col},${n.row}`;

export function useCanvas(opts: UseCanvasOptions): UseCanvasApi {
  // Always read the freshest options from handlers attached once to the element.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  // Watches the element's own box so the backing store refits on layout reflows
  // (not just viewport resize) — see the resize handling in `setCanvas`.
  const roRef = useRef<ResizeObserver | null>(null);

  // --- live drawing state kept in refs (no React re-render per point) ---
  const drawingRef = useRef(false);
  const segmentsRef = useRef<GridSegment[]>([]);
  const startNodeRef = useRef<GridNode | null>(null);
  const rawPrevRef = useRef<Point | null>(null);
  const lastSnapRef = useRef<string | null>(null);
  const rafRef = useRef(0);

  /** Translate a pointer event to a canvas-local CSS-pixel Point. */
  const toLocal = useCallback((e: PointerEvent): Point => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  /** Snapshot used by `onChange` payloads. */
  const gridSnapshot = (g: GridSpec): GridDrawing => ({
    kind: 'grid',
    segments: [...segmentsRef.current],
    grid: { cols: g.cols, rows: g.rows },
  });

  /** rAF-batched render of the whole scene (grid + committed + in-progress). */
  const draw = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    const { grid } = optsRef.current;
    clear(ctx, w, h);
    if (!grid) return;

    drawGrid(ctx, grid);
    drawGridDrawing(ctx, gridSnapshot(grid), grid);
    // in-progress rubber-band segment
    if (startNodeRef.current && rawPrevRef.current) {
      const a = nodeToPixel(startNodeRef.current, grid);
      const n = snapToNode(rawPrevRef.current, grid);
      const b = nodeToPixel(n, grid);
      ctx.save();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }
  }, []);

  const scheduleRender = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      draw();
    });
  }, [draw]);

  /** Cancel any pending frame AND clear the handle, so a later schedule isn't
   *  permanently blocked by `scheduleRender`'s `if (rafRef.current) return`
   *  guard. Without the reset, a cancel during StrictMode's mount→unmount→remount
   *  leaves a stale non-zero handle and the canvas never repaints (blank grid). */
  const cancelRender = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  /** Resize backing store for devicePixelRatio so lines stay crisp. */
  const fitToDpr = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(rect.width * dpr);
    c.height = Math.round(rect.height * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 1 unit = 1 CSS px
    ctxRef.current = ctx;
    sizeRef.current = { w: rect.width, h: rect.height, dpr };
    scheduleRender();
  }, [scheduleRender]);

  // --- pointer handlers (stable; read live opts via optsRef) ---
  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      const { grid } = optsRef.current;
      if (!grid) return;
      e.preventDefault();
      canvasRef.current?.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const p = toLocal(e);
      startNodeRef.current = snapToNode(p, grid);
      rawPrevRef.current = p;
      lastSnapRef.current = nodeKey(startNodeRef.current);
      scheduleRender();
    },
    [scheduleRender, toLocal],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drawingRef.current) return;
      const { grid, onHaptic } = optsRef.current;
      if (!grid) return;
      e.preventDefault();
      const p = toLocal(e);
      rawPrevRef.current = p;
      const snapped = snapToNode(p, grid);
      const k = nodeKey(snapped);
      // crisp haptic the instant we land on a *new* node
      if (isWithinSnap(p, grid) && k !== lastSnapRef.current) {
        lastSnapRef.current = k;
        onHaptic?.('snap');
      }
      scheduleRender();
    },
    [scheduleRender, toLocal],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      const { grid, onChange } = optsRef.current;
      canvasRef.current?.releasePointerCapture(e.pointerId);
      if (grid) {
        const from = startNodeRef.current;
        const to = snapToNode(toLocal(e), grid);
        if (from && nodeKey(from) !== nodeKey(to)) {
          segmentsRef.current.push({ from, to });
          onChange?.(gridSnapshot(grid));
        }
      }
      startNodeRef.current = null;
      rawPrevRef.current = null;
      scheduleRender();
    },
    [scheduleRender, toLocal],
  );

  // --- public actions ---
  const undo = useCallback(() => {
    const { grid, onChange } = optsRef.current;
    segmentsRef.current.pop();
    if (grid) onChange?.(gridSnapshot(grid));
    scheduleRender();
  }, [scheduleRender]);

  const reset = useCallback(() => {
    const { grid, onChange } = optsRef.current;
    segmentsRef.current = [];
    if (grid) onChange?.(gridSnapshot(grid));
    scheduleRender();
  }, [scheduleRender]);

  // --- attach element + listeners + DPR handling ---
  const detach = useCallback(
    (el: HTMLCanvasElement) => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    },
    [onPointerDown, onPointerMove, onPointerUp],
  );

  const setCanvas = useCallback(
    (el: HTMLCanvasElement | null) => {
      if (canvasRef.current === el) return;
      const prev = canvasRef.current;
      if (prev) {
        detach(prev);
        roRef.current?.unobserve(prev);
      }
      canvasRef.current = el;
      if (el) {
        fitToDpr();
        // passive:false so preventDefault works (block scroll/zoom on canvas)
        el.addEventListener('pointerdown', onPointerDown, { passive: false });
        el.addEventListener('pointermove', onPointerMove, { passive: false });
        el.addEventListener('pointerup', onPointerUp, { passive: false });
        el.addEventListener('pointercancel', onPointerUp, { passive: false });
        // Window 'resize' misses layout-driven size changes — e.g. an
        // instruction card growing/shrinking by a line reflows the drawing area
        // (Mode 2 swaps step text). Observe the element itself so the backing
        // store + sizeRef refit and the grid re-renders for the new box, not
        // just on viewport resize. Setting canvas.width/height doesn't alter the
        // CSS-driven box, so there's no observer feedback loop.
        if (typeof ResizeObserver !== 'undefined') {
          roRef.current ??= new ResizeObserver(() => fitToDpr());
          roRef.current.observe(el);
        }
      }
    },
    [detach, fitToDpr, onPointerDown, onPointerMove, onPointerUp],
  );

  useEffect(() => {
    const onResize = () => fitToDpr();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelRender();
      roRef.current?.disconnect();
    };
  }, [fitToDpr, cancelRender]);

  // The screen recomputes `grid` whenever the drawing area resizes; redraw so
  // the dots track the new geometry even if no pointer event follows (covers the
  // frame between a reflow and the next interaction).
  useEffect(() => {
    scheduleRender();
  }, [opts.grid, scheduleRender]);

  return { setCanvas, undo, reset };
}
