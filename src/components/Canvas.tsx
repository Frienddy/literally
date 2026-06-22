/**
 * Canvas component (PRD-003 R03-14, _docs/04 §3 usage note).
 *
 * Wires `useCanvas` via the `setCanvas` ref callback and exposes the shared
 * snap-to-grid controls. The drawing surface owns its gesture (`touch-action:
 * none`, also set globally in index.css) so the browser never pans/zooms while
 * drawing. Used by the dev harness; the mode screens compose `useCanvas` directly.
 */
import { useCanvas, type UseCanvasOptions } from '../hooks/useCanvas';

export interface CanvasProps extends UseCanvasOptions {
  /** Tailwind classes controlling the canvas element's CSS size. */
  canvasClassName?: string;
  /** Show the Undo control (defaults on). */
  showUndo?: boolean;
  /** Show the Reset control. */
  showReset?: boolean;
  /** Test id for the canvas element. */
  'data-testid'?: string;
}

export function Canvas({
  canvasClassName = 'h-full w-full',
  showUndo = true,
  showReset = false,
  'data-testid': testId = 'canvas',
  ...options
}: CanvasProps) {
  const { setCanvas, undo, reset } = useCanvas(options);
  const undoVisible = showUndo;

  return (
    <div className="flex h-full w-full flex-col items-center gap-3">
      <canvas
        ref={setCanvas}
        data-testid={testId}
        className={`touch-none ${canvasClassName}`}
      />

      {(undoVisible || showReset) && (
        <div className="flex gap-3">
          {undoVisible && (
            <button
              type="button"
              data-testid="canvas-undo"
              onClick={undo}
              className="min-h-[44px] rounded-xl bg-slate-700 px-5 py-2 text-sm font-medium text-slate-100"
            >
              Undo
            </button>
          )}
          {showReset && (
            <button
              type="button"
              data-testid="canvas-reset"
              onClick={reset}
              className="min-h-[44px] rounded-xl bg-slate-700 px-5 py-2 text-sm font-medium text-slate-100"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
