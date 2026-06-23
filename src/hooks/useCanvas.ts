/**
 * useCanvas (PRD-003 R03-6…R03-14, _docs/04 §3).
 *
 * The shared pixel-paint drawing surface for **both** modes (ADR-015): a pointer
 * press fills the cell under it with the current color, and a drag keeps filling
 * each new cell it crosses. The canvas is an imperative island (ADR-006): live
 * paint state accumulates in refs and renders on `requestAnimationFrame`; React
 * never re-renders during a stroke. The store is touched only via `onChange`, once
 * per finished stroke (pointer up) — and on undo/reset.
 *
 * Undo is per *stroke*: one press-and-drag is one undo step (so Mode 2's single
 * taps undo one cell, and a Mode 1 drag undoes the whole sweep). Re-painting a cell
 * a new color replaces it in place — it doesn't stack a second cell.
 *
 * The handlers are stable (`useCallback` with stable deps) and read the latest
 * options from `optsRef`, so an inline `onChange`/`onHaptic`/`color` from a screen
 * never goes stale without re-binding listeners.
 */
import { useCallback, useEffect, useRef } from 'react';
import type {
  PixelDrawing,
  PixelCell,
  GridNode,
  Point,
} from '../types/session';
import { pointToCell, type GridSpec } from '../engine/snap';
import { clear, drawGrid, drawPixelDrawing } from '../engine/render';
import { DEFAULT_COLOR } from '../config';
import type { HapticKind } from './useHaptics';

export interface UseCanvasOptions {
  /** The cell grid the canvas paints on (omit until measured; the hook no-ops). */
  grid?: GridSpec;
  /** The color each painted cell takes. Defaults to the first palette swatch. */
  color?: string;
  /**
   * Tap-only painting: fill just the pressed cell, ignore drag-across (Mode 2,
   * where each step is one deliberate square). Defaults to drag-to-paint (Mode 1).
   */
  singleCell?: boolean;
  /** Called once per newly-painted cell that produces haptic-worthy feedback. */
  onHaptic?: (kind: HapticKind) => void;
  /** Called when a stroke finishes (or undo/reset), with the full drawing. */
  onChange?: (drawing: PixelDrawing) => void;
}

export interface UseCanvasApi {
  /** Ref callback for the `<canvas>` element. */
  setCanvas: (el: HTMLCanvasElement | null) => void;
  /** Remove the last painted stroke. */
  undo: () => void;
  /** Clear all painted cells. */
  reset: () => void;
}

const cellKey = (n: GridNode): string => `${n.col},${n.row}`;

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

  // --- live paint state kept in refs (no React re-render per cell) ---
  const paintingRef = useRef(false);
  const cellsRef = useRef<PixelCell[]>([]);
  // Index in `cells` where each stroke began — the undo boundaries (LIFO).
  const strokeStartsRef = useRef<number[]>([]);
  const lastCellRef = useRef<string | null>(null);
  const rafRef = useRef(0);

  /** Translate a pointer event to a canvas-local CSS-pixel Point. */
  const toLocal = useCallback((e: PointerEvent): Point => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  /** Snapshot used by `onChange` payloads. */
  const snapshot = (g: GridSpec): PixelDrawing => ({
    kind: 'pixel',
    cells: cellsRef.current.map((c) => ({ ...c })),
    grid: { cols: g.cols, rows: g.rows },
  });

  /**
   * Paint a cell with `color`, deduped by coordinate (re-paint replaces in place).
   * Returns whether anything changed and whether a *new* cell was added (haptic).
   */
  const paintCell = (
    node: GridNode,
    color: string,
  ): { changed: boolean; added: boolean } => {
    const k = cellKey(node);
    const idx = cellsRef.current.findIndex((c) => cellKey(c) === k);
    if (idx === -1) {
      cellsRef.current.push({ col: node.col, row: node.row, color });
      return { changed: true, added: true };
    }
    if (cellsRef.current[idx].color === color)
      return { changed: false, added: false };
    cellsRef.current[idx] = { col: node.col, row: node.row, color };
    return { changed: true, added: false };
  };

  /** rAF-batched render of the whole scene (grid + every painted cell). */
  const draw = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    const { grid } = optsRef.current;
    clear(ctx, w, h);
    if (!grid) return;
    drawGrid(ctx, grid);
    drawPixelDrawing(ctx, snapshot(grid), grid);
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

  /** Resize backing store for devicePixelRatio so cells stay crisp. */
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
      const { grid, color, onHaptic } = optsRef.current;
      if (!grid) return;
      e.preventDefault();
      const cell = pointToCell(toLocal(e), grid);
      if (!cell) return; // pressed outside the cell field — nothing to paint
      canvasRef.current?.setPointerCapture(e.pointerId);
      paintingRef.current = true;
      strokeStartsRef.current.push(cellsRef.current.length); // undo boundary
      lastCellRef.current = cellKey(cell);
      if (paintCell(cell, color ?? DEFAULT_COLOR).added) onHaptic?.('snap');
      scheduleRender();
    },
    [scheduleRender, toLocal],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!paintingRef.current) return;
      const { grid, color, singleCell, onHaptic } = optsRef.current;
      if (!grid || singleCell) return; // tap-only mode ignores drag-across
      e.preventDefault();
      const cell = pointToCell(toLocal(e), grid);
      if (!cell) return;
      const k = cellKey(cell);
      if (k === lastCellRef.current) return; // still on the same cell
      lastCellRef.current = k;
      if (paintCell(cell, color ?? DEFAULT_COLOR).added) onHaptic?.('snap');
      scheduleRender();
    },
    [scheduleRender, toLocal],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!paintingRef.current) return;
      paintingRef.current = false;
      const { grid, onChange } = optsRef.current;
      canvasRef.current?.releasePointerCapture(e.pointerId);
      if (grid) onChange?.(snapshot(grid)); // commit the finished stroke once
      lastCellRef.current = null;
      scheduleRender();
    },
    [scheduleRender],
  );

  // --- public actions ---
  const undo = useCallback(() => {
    const { grid, onChange } = optsRef.current;
    const start = strokeStartsRef.current.pop();
    if (start !== undefined) cellsRef.current.length = start; // drop that stroke
    if (grid) onChange?.(snapshot(grid));
    scheduleRender();
  }, [scheduleRender]);

  const reset = useCallback(() => {
    const { grid, onChange } = optsRef.current;
    cellsRef.current = [];
    strokeStartsRef.current = [];
    if (grid) onChange?.(snapshot(grid));
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
  // the cells track the new geometry even if no pointer event follows (covers the
  // frame between a reflow and the next interaction).
  useEffect(() => {
    scheduleRender();
  }, [opts.grid, scheduleRender]);

  return { setCanvas, undo, reset };
}
