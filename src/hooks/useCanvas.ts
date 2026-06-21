/**
 * useCanvas (PRD-003 R03-6…R03-14, _docs/04 §3).
 *
 * One hook, two behaviors — Mode 1 (freehand + wobble) and Mode 2 (snap-to-grid).
 * The canvas is an imperative island (ADR-006): per-point data accumulates in
 * refs and renders on `requestAnimationFrame`; React never re-renders during a
 * stroke. The store is touched only via `onChange`, once per finished
 * stroke/segment.
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
  FreehandDrawing,
  FreehandStroke,
  GridDrawing,
  GridSegment,
  GridNode,
  Point,
} from '../types/session';
import { applyWobble, type WobbleConfig } from '../engine/wobble';
import {
  snapToNode,
  isWithinSnap,
  nodeToPixel,
  type GridSpec,
} from '../engine/snap';
import {
  clear,
  drawGrid,
  drawFreehand,
  drawGridDrawing,
} from '../engine/render';
import { simplify, quantize } from '../engine/geometry';
import { config } from '../config';
import type { HapticKind } from './useHaptics';

export type CanvasMode = 'freehand' | 'grid';

export interface UseCanvasOptions {
  mode: CanvasMode;
  /** Mode 1 wobble settings (ignored in grid mode). */
  wobble?: WobbleConfig;
  /** Mode 2 grid (ignored in freehand mode). */
  grid?: GridSpec;
  /** Called once per movement that produces haptic-worthy feedback. */
  onHaptic?: (kind: HapticKind) => void;
  /** Called when a stroke/segment finishes (or undo/reset), with the full drawing. */
  onChange?: (drawing: FreehandDrawing | GridDrawing) => void;
  /** Freehand stroke width in px. */
  strokeWidth?: number;
  /**
   * Freehand stroke colour for the *live* canvas (ignored in grid mode). Mode 1
   * passes a distinct, legible `stormInk` so the line shows on the dark storm
   * canvas (DEBT-006); omit to use the committed ink. Saved previews always
   * re-render with the committed ink on their light surface.
   */
  ink?: string;
}

export interface UseCanvasApi {
  /** Ref callback for the `<canvas>` element. */
  setCanvas: (el: HTMLCanvasElement | null) => void;
  /** Remove the last stroke/segment (Undo is surfaced only in Mode 2 per GDD). */
  undo: () => void;
  /** Clear all strokes/segments. */
  reset: () => void;
}

const DEFAULT_STROKE_WIDTH = 3;
const nodeKey = (n: GridNode): string => `${n.col},${n.row}`;

export function useCanvas(opts: UseCanvasOptions): UseCanvasApi {
  // Always read the freshest options from handlers attached once to the element.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  // --- live drawing state kept in refs (no React re-render per point) ---
  const drawingRef = useRef(false);
  // freehand:
  const strokesRef = useRef<FreehandStroke[]>([]);
  const currentRef = useRef<Point[]>([]);
  const rawPrevRef = useRef<Point | null>(null);
  const travelledRef = useRef(0);
  const seedRef = useRef(1);
  // grid:
  const segmentsRef = useRef<GridSegment[]>([]);
  const startNodeRef = useRef<GridNode | null>(null);
  const lastSnapRef = useRef<string | null>(null);
  // haptics throttle (freehand):
  const lastHapticRef = useRef(0);
  const rafRef = useRef(0);

  const strokeWidth = (): number =>
    optsRef.current.strokeWidth ?? DEFAULT_STROKE_WIDTH;

  /** Translate a pointer event to a canvas-local CSS-pixel Point. */
  const toLocal = useCallback((e: PointerEvent): Point => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  /** Snapshots used by `onChange` payloads. */
  const freehandSnapshot = (): FreehandDrawing => ({
    kind: 'freehand',
    strokes: [...strokesRef.current],
    canvas: { width: sizeRef.current.w, height: sizeRef.current.h },
  });
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
    const { mode, grid, ink } = optsRef.current;
    clear(ctx, w, h);

    if (mode === 'grid' && grid) {
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
    } else {
      const live: FreehandStroke[] = currentRef.current.length
        ? [
            ...strokesRef.current,
            { points: currentRef.current, width: strokeWidth() },
          ]
        : strokesRef.current;
      drawFreehand(
        ctx,
        {
          kind: 'freehand',
          strokes: live,
          canvas: { width: w, height: h },
        },
        ink,
      );
    }
  }, []);

  const scheduleRender = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      draw();
    });
  }, [draw]);

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
      e.preventDefault();
      const { mode, grid } = optsRef.current;
      canvasRef.current?.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const p = toLocal(e);

      if (mode === 'grid' && grid) {
        startNodeRef.current = snapToNode(p, grid);
        rawPrevRef.current = p;
        lastSnapRef.current = nodeKey(startNodeRef.current);
      } else {
        seedRef.current = (seedRef.current * 16807) % 2147483647; // new seed/stroke
        currentRef.current = [p];
        rawPrevRef.current = p;
        travelledRef.current = 0;
      }
      scheduleRender();
    },
    [scheduleRender, toLocal],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();
      const { mode, grid, wobble, onHaptic } = optsRef.current;
      const p = toLocal(e);

      if (mode === 'grid' && grid) {
        rawPrevRef.current = p;
        const snapped = snapToNode(p, grid);
        const k = nodeKey(snapped);
        // crisp haptic the instant we land on a *new* node
        if (isWithinSnap(p, grid) && k !== lastSnapRef.current) {
          lastSnapRef.current = k;
          onHaptic?.('snap');
        }
      } else {
        const prev = rawPrevRef.current!;
        travelledRef.current += Math.hypot(p.x - prev.x, p.y - prev.y);
        const wobbled = wobble
          ? applyWobble(p, prev, seedRef.current, travelledRef.current, wobble)
          : p;
        currentRef.current.push(wobbled);
        rawPrevRef.current = p;
        // throttled, jittered erratic haptic while moving
        const t = performance.now();
        if (
          t - lastHapticRef.current >
          280 + ((travelledRef.current | 0) % 160)
        ) {
          lastHapticRef.current = t;
          onHaptic?.('move');
        }
      }
      scheduleRender();
    },
    [scheduleRender, toLocal],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      const { mode, grid, onChange } = optsRef.current;
      canvasRef.current?.releasePointerCapture(e.pointerId);

      if (mode === 'grid' && grid) {
        const from = startNodeRef.current;
        const to = snapToNode(toLocal(e), grid);
        if (from && nodeKey(from) !== nodeKey(to)) {
          segmentsRef.current.push({ from, to });
          onChange?.(gridSnapshot(grid));
        }
        startNodeRef.current = null;
        rawPrevRef.current = null;
      } else {
        // simplify + quantize the finished stroke before committing (storage)
        const pts = quantize(simplify(currentRef.current));
        if (pts.length > 1) {
          strokesRef.current.push({ points: pts, width: strokeWidth() });
        }
        currentRef.current = [];
        onChange?.(freehandSnapshot());
      }
      scheduleRender();
    },
    [scheduleRender, toLocal],
  );

  // --- public actions ---
  const undo = useCallback(() => {
    const { mode, grid, onChange } = optsRef.current;
    if (mode === 'grid') {
      segmentsRef.current.pop();
      if (grid) onChange?.(gridSnapshot(grid));
    } else {
      strokesRef.current.pop();
      onChange?.(freehandSnapshot());
    }
    scheduleRender();
  }, [scheduleRender]);

  const reset = useCallback(() => {
    const { mode, grid, onChange } = optsRef.current;
    strokesRef.current = [];
    segmentsRef.current = [];
    currentRef.current = [];
    if (mode === 'grid' && grid) onChange?.(gridSnapshot(grid));
    else onChange?.(freehandSnapshot());
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
      if (prev) detach(prev);
      canvasRef.current = el;
      if (el) {
        fitToDpr();
        // passive:false so preventDefault works (block scroll/zoom on canvas)
        el.addEventListener('pointerdown', onPointerDown, { passive: false });
        el.addEventListener('pointermove', onPointerMove, { passive: false });
        el.addEventListener('pointerup', onPointerUp, { passive: false });
        el.addEventListener('pointercancel', onPointerUp, { passive: false });
      }
    },
    [detach, fitToDpr, onPointerDown, onPointerMove, onPointerUp],
  );

  useEffect(() => {
    const onResize = () => fitToDpr();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fitToDpr]);

  return { setCanvas, undo, reset };
}

/** Default wobble config sourced from the tunables surface. */
export const defaultWobble: WobbleConfig = config.wobble;
