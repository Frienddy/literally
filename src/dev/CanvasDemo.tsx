/**
 * Canvas demo harness (PRD-003 §3 "engine + hook + a demo harness, not the mode
 * UX"). NOT a product screen — the real Mode 1 / Mode 2 screens arrive in
 * PRD-005/006. This harness exists so the engine + `useCanvas` can be driven by
 * Playwright touch E2E before any screen exists. It is lazy-loaded only when the
 * app is opened with `?harness=canvas` (see App.tsx), so it never ships into the
 * normal app path or the main bundle.
 *
 * Drives the shared snap-to-grid canvas (ADR-015) the mode screens now own.
 */
import { useState } from 'react';
import { Canvas } from '../components/Canvas';
import { useHaptics, type HapticKind } from '../hooks/useHaptics';
import { config } from '../config';
import { computeGridSpec } from '../engine/grid';
import type { GridDrawing } from '../types/session';

// Fixed canvas CSS size so the demo grid + Playwright coordinates are
// deterministic (no async measurement race). Real screens size to the viewport.
const CANVAS_W = 320;
const CANVAS_H = 400;

export default function CanvasDemo() {
  const grid = computeGridSpec(
    CANVAS_W,
    CANVAS_H,
    config.grid.cols,
    config.grid.rows,
  );

  const { vibrate, supported } = useHaptics();
  const [last, setLast] = useState<GridDrawing | null>(null);
  const [haptics, setHaptics] = useState<HapticKind[]>([]);

  const onHaptic = (kind: HapticKind) => {
    vibrate(kind);
    setHaptics((h) => [...h, kind]);
  };

  return (
    <div className="flex h-full w-full flex-col items-center gap-2 overflow-hidden p-3 text-xs text-slate-300">
      <h1 className="text-sm font-semibold text-slate-100">
        Canvas demo · grid
      </h1>

      <Canvas
        grid={grid}
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
