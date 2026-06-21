# 04 — Canvas Engine (`useCanvas`)

The core HTML5 Canvas hook handling **both** Mode 1 (freehand + wobble) and
Mode 2 (snap-to-grid). This is an explicit deliverable from the spec's Output
Request. The drawing logic is split into a pure `engine/` layer (unit-testable,
framework-free) and a thin React hook that owns the canvas element and pointer
events.

---

## 1. Design goals

> These mechanics **are** the "show, don't tell." Mode 1's wobble and erratic
> haptics make "without clear instruction" *feel* unsteady and out of control;
> Mode 2's snapping and crisp click make "with instruction" *feel* certain and
> safe. The contrast reaches the player through their fingertips — it is never
> explained in words. (See [01](./01-game-design.md) §1.1.)

- **Zero-latency feel.** Accumulate points in refs; render on `requestAnimationFrame`;
  never trigger React re-renders during a stroke.
- **One hook, two behaviors.** A `mode` param ('freehand' | 'grid') switches
  between wobble-freehand and snap-to-grid. Shared plumbing (DPR sizing, pointer
  handling, rAF loop) is written once.
- **Crisp on retina.** Size the backing store by `devicePixelRatio`.
- **Deterministic-ish wobble.** Noise is smooth and seeded so a redraw of saved
  data looks the same.
- **Pure engine, thin hook.** All math lives in `engine/*`; the hook orchestrates.

## 2. Pure engine modules

### 2.1 Geometry — `src/engine/geometry.ts`

```ts
import type { Point } from '../types/session';

export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Ramer–Douglas–Peucker simplification — shrinks freehand payloads. */
export function simplify(points: Point[], epsilon = 1.2): Point[] {
  if (points.length < 3) return points;
  let maxD = 0;
  let idx = 0;
  const [first, last] = [points[0], points[points.length - 1]];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxD) ((maxD = d), (idx = i));
  }
  if (maxD > epsilon) {
    const left = simplify(points.slice(0, idx + 1), epsilon);
    const right = simplify(points.slice(idx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

/** Round to integers to cut storage size with no visible loss. */
export const quantize = (pts: Point[]): Point[] =>
  pts.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
```

### 2.2 Wobble (Mode 1) — `src/engine/wobble.ts`

Adds a small, organic, *perpendicular* displacement to each incoming point so
strokes look slightly shaky/unsteady — the tactile half of "lack of control."
Uses value-noise (smooth, not white-noise jitter) seeded per stroke so a saved
drawing re-renders identically.

```ts
import type { Point } from '../types/session';

/** Cheap smooth 1-D value noise in [-1, 1]. */
function valueNoise(seed: number, x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => {
    const s = Math.sin((n + seed) * 127.1) * 43758.5453;
    return s - Math.floor(s); // [0,1)
  };
  const a = h(i);
  const b = h(i + 1);
  const u = f * f * (3 - 2 * f);         // smoothstep
  return (a + (b - a) * u) * 2 - 1;       // → [-1,1]
}

export interface WobbleConfig {
  amplitude: number;  // px of max sideways deviation (start ~3)
  frequency: number;  // how fast wobble varies along the stroke (~0.18)
}

/** Displace `p` perpendicular to the local direction (prev→p) by seeded noise. */
export function applyWobble(
  p: Point,
  prev: Point | null,
  seed: number,
  travelled: number,
  cfg: WobbleConfig,
): Point {
  if (!prev) return p;
  const dx = p.x - prev.x;
  const dy = p.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  // perpendicular unit vector
  const nx = -dy / len;
  const ny = dx / len;
  const n = valueNoise(seed, travelled * cfg.frequency);
  return { x: p.x + nx * n * cfg.amplitude, y: p.y + ny * n * cfg.amplitude };
}
```

> **Why perpendicular + smooth noise?** Perpendicular displacement keeps the
> stroke moving the same overall direction while making the *line* wobble.
> Value-noise (vs `Math.random()`) gives a continuous shaky line, not static —
> and seeding makes it reproducible for saved-drawing replay. Note `Math.random`
> is fine in app runtime; it's only disallowed inside Workflow scripts.

### 2.3 Snap (Mode 2) — `src/engine/snap.ts`

```ts
import type { GridNode, Point } from '../types/session';

export interface GridSpec {
  cols: number;
  rows: number;
  /** px size of one cell (square). */
  cell: number;
  /** px offset of node (0,0) from canvas top-left. */
  originX: number;
  originY: number;
}

export const nodeToPixel = (n: GridNode, g: GridSpec): Point => ({
  x: g.originX + n.col * g.cell,
  y: g.originY + n.row * g.cell,
});

/** Nearest grid node to a raw pointer position, clamped to grid bounds. */
export function snapToNode(p: Point, g: GridSpec): GridNode {
  const col = clamp(Math.round((p.x - g.originX) / g.cell), 0, g.cols - 1);
  const row = clamp(Math.round((p.y - g.originY) / g.cell), 0, g.rows - 1);
  return { col, row };
}

/** True only when the pointer is within `tolerance` px of the snapped node —
 *  used to fire the satisfying haptic "click" exactly on snap. */
export function isWithinSnap(p: Point, g: GridSpec, tolerance = g.cell * 0.4) {
  const n = snapToNode(p, g);
  const px = nodeToPixel(n, g);
  return Math.hypot(p.x - px.x, p.y - px.y) <= tolerance;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
```

### 2.4 Rendering — `src/engine/render.ts`

Shared by the live hook *and* the read-only previews (reflection/history), so a
saved drawing always looks exactly like it did live.

```ts
import type { DrawingData, FreehandDrawing, GridDrawing } from '../types/session';
import type { GridSpec } from './snap';
import { nodeToPixel } from './snap';

export function clear(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
}

export function drawGrid(ctx: CanvasRenderingContext2D, g: GridSpec) {
  ctx.save();
  ctx.fillStyle = '#1f6feb';                 // high-contrast nodes
  for (let c = 0; c < g.cols; c++) {
    for (let r = 0; r < g.rows; r++) {
      const x = g.originX + c * g.cell;
      const y = g.originY + r * g.cell;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawFreehand(ctx: CanvasRenderingContext2D, d: FreehandDrawing) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#111827';
  for (const stroke of d.strokes) {
    if (stroke.points.length < 2) continue;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGridDrawing(
  ctx: CanvasRenderingContext2D,
  d: GridDrawing,
  g: GridSpec,
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#111827';
  for (const seg of d.segments) {
    const a = nodeToPixel(seg.from, g);
    const b = nodeToPixel(seg.to, g);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}
```

### 2.5 Mode 2 guidance & the target overlay — `src/engine/render.ts` (cont.)

Two small helpers make "with instruction" *visibly* effortless and power the
Reflection target reveal. They live alongside the other pure renderers.

```ts
/** Mode 2: pulse the current step's start node and ghost its target move, so the
 *  player can SEE exactly where to go. `phase` (0..1) drives the pulse — pass
 *  (elapsed % period) / period from the rAF loop. */
export function drawStepGuidance(
  ctx: CanvasRenderingContext2D,
  step: GridSegment,
  g: GridSpec,
  phase: number,
) {
  const from = nodeToPixel(step.from, g);
  const to = nodeToPixel(step.to, g);
  ctx.save();
  // faint ghost of the target move
  ctx.strokeStyle = 'rgba(31,111,235,.28)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  // pulsing start node
  ctx.setLineDash([]);
  ctx.fillStyle = '#1f9d57';
  const r = 5 + 3 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
  ctx.beginPath();
  ctx.arc(from.x, from.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Reflection: draw the *intended* result faintly behind the player's Mode 1
 *  attempt so the gap is visible (the target reveal). Render this FIRST, then the
 *  freehand attempt on top. */
export function drawTargetGhost(
  ctx: CanvasRenderingContext2D,
  target: GridDrawing,
  g: GridSpec,
) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  drawGridDrawing(ctx, target, g);
  ctx.restore();
}
```

> `GridSegment` is imported from `../types/session` (already used by `GridDrawing`).
> The "completion moment" (Mode 2) and the storm→anchor transition are
> CSS/animation concerns ([06](./06-ui-ux-spec.md) §4 tokens), not canvas logic.

## 3. The `useCanvas` hook — `src/hooks/useCanvas.ts`

```ts
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
import { snapToNode, isWithinSnap, nodeToPixel, type GridSpec } from '../engine/snap';
import {
  clear,
  drawGrid,
  drawFreehand,
  drawGridDrawing,
} from '../engine/render';
import { simplify, quantize } from '../engine/geometry';

type Mode = 'freehand' | 'grid';

interface UseCanvasOptions {
  mode: Mode;
  /** Mode 1 wobble settings (ignored in grid mode). */
  wobble?: WobbleConfig;
  /** Mode 2 grid (ignored in freehand mode). */
  grid?: GridSpec;
  /** Called once per movement that produces haptic-worthy feedback.
   *  - freehand: erratic pattern while moving
   *  - grid: crisp pulse exactly on snap to a *new* node */
  onHaptic?: (kind: 'move' | 'snap') => void;
  /** Called when a stroke/segment finishes, with the current full drawing. */
  onChange?: (drawing: FreehandDrawing | GridDrawing) => void;
}

export function useCanvas(opts: UseCanvasOptions) {
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

  /** Translate a pointer event to a canvas-local CSS-pixel Point. */
  const toLocal = useCallback((e: PointerEvent): Point => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  /** Resize backing store for devicePixelRatio so lines stay crisp. */
  const fitToDpr = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(rect.width * dpr);
    c.height = Math.round(rect.height * dpr);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 1 unit = 1 CSS px
    ctxRef.current = ctx;
    sizeRef.current = { w: rect.width, h: rect.height, dpr };
    scheduleRender();
  }, []);

  /** rAF-batched render of the whole scene (grid + committed + in-progress). */
  const scheduleRender = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const ctx = ctxRef.current;
      if (!ctx) return;
      const { w, h } = sizeRef.current;
      clear(ctx, w, h);

      if (opts.mode === 'grid' && opts.grid) {
        drawGrid(ctx, opts.grid);
        drawGridDrawing(
          ctx,
          { kind: 'grid', segments: segmentsRef.current, grid: { cols: opts.grid.cols, rows: opts.grid.rows } },
          opts.grid,
        );
        // in-progress rubber-band segment
        if (startNodeRef.current && rawPrevRef.current) {
          const a = nodeToPixel(startNodeRef.current, opts.grid);
          const n = snapToNode(rawPrevRef.current, opts.grid);
          const b = nodeToPixel(n, opts.grid);
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
          ? [...strokesRef.current, { points: currentRef.current, width: 3 }]
          : strokesRef.current;
        drawFreehand(ctx, {
          kind: 'freehand',
          strokes: live,
          canvas: { width: sizeRef.current.w, height: sizeRef.current.h },
        });
      }
    });
  }, [opts.mode, opts.grid]);

  // --- pointer handlers ---
  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      canvasRef.current?.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const p = toLocal(e);

      if (opts.mode === 'grid' && opts.grid) {
        startNodeRef.current = snapToNode(p, opts.grid);
        rawPrevRef.current = p;
        lastSnapRef.current = key(startNodeRef.current);
      } else {
        seedRef.current = (seedRef.current * 16807) % 2147483647; // new seed/stroke
        currentRef.current = [p];
        rawPrevRef.current = p;
        travelledRef.current = 0;
      }
      scheduleRender();
    },
    [opts.mode, opts.grid, scheduleRender, toLocal],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();
      const p = toLocal(e);

      if (opts.mode === 'grid' && opts.grid) {
        rawPrevRef.current = p;
        const snapped = snapToNode(p, opts.grid);
        const k = key(snapped);
        // crisp haptic the instant we land on a *new* node
        if (isWithinSnap(p, opts.grid) && k !== lastSnapRef.current) {
          lastSnapRef.current = k;
          opts.onHaptic?.('snap');
        }
      } else {
        const prev = rawPrevRef.current!;
        travelledRef.current += Math.hypot(p.x - prev.x, p.y - prev.y);
        const wobbled = opts.wobble
          ? applyWobble(p, prev, seedRef.current, travelledRef.current, opts.wobble)
          : p;
        currentRef.current.push(wobbled);
        rawPrevRef.current = p;
        // throttled erratic haptic while moving
        const t = performance.now();
        if (t - lastHapticRef.current > 280 + ((travelledRef.current | 0) % 160)) {
          lastHapticRef.current = t;
          opts.onHaptic?.('move');
        }
      }
      scheduleRender();
    },
    [opts.mode, opts.grid, opts.wobble, scheduleRender, toLocal],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      canvasRef.current?.releasePointerCapture(e.pointerId);

      if (opts.mode === 'grid' && opts.grid) {
        const from = startNodeRef.current;
        const to = snapToNode(toLocal(e), opts.grid);
        if (from && key(from) !== key(to)) {
          segmentsRef.current.push({ from, to });
          opts.onChange?.({
            kind: 'grid',
            segments: [...segmentsRef.current],
            grid: { cols: opts.grid.cols, rows: opts.grid.rows },
          });
        }
        startNodeRef.current = null;
        rawPrevRef.current = null;
      } else {
        // simplify + quantize the finished stroke before committing (storage)
        const pts = quantize(simplify(currentRef.current));
        if (pts.length > 1) strokesRef.current.push({ points: pts, width: 3 });
        currentRef.current = [];
        opts.onChange?.({
          kind: 'freehand',
          strokes: [...strokesRef.current],
          canvas: { width: sizeRef.current.w, height: sizeRef.current.h },
        });
      }
      scheduleRender();
    },
    [opts.mode, opts.grid, scheduleRender, toLocal],
  );

  // --- public actions ---
  const undo = useCallback(() => {
    if (opts.mode === 'grid') segmentsRef.current.pop();
    else strokesRef.current.pop();
    scheduleRender();
  }, [opts.mode, scheduleRender]);

  const reset = useCallback(() => {
    strokesRef.current = [];
    segmentsRef.current = [];
    currentRef.current = [];
    scheduleRender();
  }, [scheduleRender]);

  // --- attach element + listeners + DPR handling ---
  const setCanvas = useCallback(
    (el: HTMLCanvasElement | null) => {
      if (canvasRef.current === el) return;
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
    [fitToDpr, onPointerDown, onPointerMove, onPointerUp],
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

const key = (n: GridNode) => `${n.col},${n.row}`;
```

> **Usage:** `<Canvas/>` calls `useCanvas({ mode, wobble|grid, onHaptic, onChange })`,
> passes `setCanvas` as the canvas `ref` callback, and renders Undo/Reset buttons
> bound to the returned actions (Undo only shown in Mode 2 per the GDD).
> `onHaptic` is wired to `useHaptics()` ([05](./05-pwa-and-mobile-shell.md) §Haptics):
> `'move' → vibrate([10,30,15,40])`, `'snap' → vibrate(15)`.

## 4. Key correctness points

- **`touch-action: none`** must be set on the `<canvas>` (CSS) so the browser
  doesn't pan/zoom while you draw — paired with `preventDefault` in handlers.
- **Pointer capture** keeps the stroke alive even if the finger drifts off the
  canvas edge mid-stroke.
- **DPR sizing** prevents blurry lines on retina phones; re-fit on resize/rotate.
- **Refs over state** for per-point data is the single most important latency
  decision — React never renders during a stroke; only `onChange` (per stroke)
  touches the store.
- **Saved == live**: previews use the same `engine/render.ts`, so the reflection
  screen reproduces drawings faithfully.

## 5. Test hooks (see [09](./09-testing-and-qa.md))

- `engine/wobble.ts`, `snap.ts`, `geometry.ts` are pure → straightforward unit
  tests (determinism, clamping, simplification ratios).
- `useCanvas` behavior is covered by Playwright touch-emulation E2E (draw a
  stroke → assert `onChange` payload shape; drag across nodes → assert snap
  segments + snap haptic count).
