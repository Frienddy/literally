/**
 * Canvas demo harness (PRD-003 §3 "engine + hook + a demo harness, not the mode
 * UX"). NOT a product screen — the real Mode 1 / Mode 2 screens arrive in
 * PRD-005/006. This harness exists so the engine + `useCanvas` can be driven by
 * Playwright touch E2E before any screen exists. It is lazy-loaded only when the
 * app is opened with `?harness=canvas` (see App.tsx), so it never ships into the
 * normal app path or the main bundle.
 *
 * Query params: `?harness=canvas` (freehand, default) · `&mode=grid`.
 */
import { useState } from 'react';
import { Canvas } from '../components/Canvas';
import { useHaptics, type HapticKind } from '../hooks/useHaptics';
import { config } from '../config';
import type { GridSpec } from '../engine/snap';
import type { FreehandDrawing, GridDrawing } from '../types/session';

// Fixed canvas CSS size so the demo grid + Playwright coordinates are
// deterministic (no async measurement race). Real screens size to the viewport.
const CANVAS_W = 320;
const CANVAS_H = 400;

/** A centered grid spec for the demo canvas. */
function computeGrid(w: number, h: number): GridSpec {
  const { cols, rows } = config.grid;
  const pad = 24;
  const cell = Math.min((w - pad * 2) / (cols - 1), (h - pad * 2) / (rows - 1));
  const span = (n: number) => cell * (n - 1);
  return {
    cols,
    rows,
    cell,
    originX: (w - span(cols)) / 2,
    originY: (h - span(rows)) / 2,
  };
}

export default function CanvasDemo() {
  const mode =
    new URLSearchParams(window.location.search).get('mode') === 'grid'
      ? 'grid'
      : 'freehand';
  const grid = mode === 'grid' ? computeGrid(CANVAS_W, CANVAS_H) : undefined;

  const { vibrate, supported } = useHaptics();
  const [last, setLast] = useState<FreehandDrawing | GridDrawing | null>(null);
  const [haptics, setHaptics] = useState<HapticKind[]>([]);

  const onHaptic = (kind: HapticKind) => {
    vibrate(kind);
    setHaptics((h) => [...h, kind]);
  };

  return (
    <div className="flex h-full w-full flex-col items-center gap-2 overflow-hidden p-3 text-xs text-slate-300">
      <h1 className="text-sm font-semibold text-slate-100">
        Canvas demo · {mode}
      </h1>

      <Canvas
        mode={mode}
        grid={grid}
        wobble={config.wobble}
        onHaptic={onHaptic}
        onChange={(d) => setLast(d)}
        showReset
        canvasClassName="h-[400px] w-[320px] rounded-lg bg-white"
        data-testid="demo-canvas"
      />

      <pre
        data-testid="last-change"
        className="max-h-16 w-full overflow-hidden text-[10px]"
      >
        {last ? JSON.stringify(last) : 'none'}
      </pre>
      <div data-testid="haptic-log">{haptics.join(',')}</div>
      <div data-testid="haptic-supported">{String(supported)}</div>
      <div data-testid="grid-spec">{grid ? JSON.stringify(grid) : 'none'}</div>
    </div>
  );
}
