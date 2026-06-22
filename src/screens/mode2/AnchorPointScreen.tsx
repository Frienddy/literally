/**
 * Mode 2 — "Anchor Point" (PRD-006, _docs/01 §4, _docs/06 §3.4). The structured
 * half of the core contrast: a high-contrast snap-to-grid canvas, one literal
 * instruction at a time, explicit progress, full Undo, crisp confirming haptics,
 * **no timers**, and a calm completion moment. Each finished line advances to the
 * next step automatically — the player draws, the step pager follows — so the
 * literal instructions, not a button, drive the rhythm. Emotional target: total
 * control, predictability, mastery — the opposite of Mode 1's nothing.
 *
 * Composition: `useCanvas({grid})` (PRD-003) owns the drawing as an imperative
 * island (ADR-006); `StepInstruction` paginates the authored `mode2.steps`
 * (PRD-006 content) and exposes Undo; committing a segment advances the step, and
 * committing the last one opens `GiverBeat`'s "Perfect — exactly right!" beat,
 * after which the drawing is saved and the flow advances to Feedback #2. Mode 1
 * and Mode 2 share the same snap-to-grid canvas (ADR-015) — the step pager is the
 * only difference the player meets.
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useDraft } from '../../store/selectors';
import { useCanvas } from '../../hooks/useCanvas';
import { useHaptics } from '../../hooks/useHaptics';
import { computeGridSpec } from '../../engine/grid';
import type { GridSpec } from '../../engine/snap';
import type { GridDrawing } from '../../types/session';
import { FlowProgress } from '../../components/FlowProgress';
import { StepInstruction } from '../../components/StepInstruction';
import { GiverBeat } from '../../components/GiverBeat';
import { resolveTask } from '../../content/tasks';
import { giver } from '../../content/giver.copy';
import { strings } from '../../content/strings';

const emptyGrid = (cols: number, rows: number): GridDrawing => ({
  kind: 'grid',
  segments: [],
  grid: { cols, rows },
});

export function AnchorPointScreen() {
  const go = useGameStore((s) => s.go);
  const saveMode2Drawing = useGameStore((s) => s.saveMode2Drawing);
  const draft = useDraft();
  const task = resolveTask(draft?.task_id ?? 'house');
  const { steps } = task;
  const total = steps.length;

  const { vibrate } = useHaptics();

  const [completing, setCompleting] = useState(false);
  // The committed drawing is updated once per finished segment (not per pointer
  // event — ADR-006), then saved once at completion (R06-13).
  const [drawing, setDrawing] = useState<GridDrawing>(() =>
    emptyGrid(task.grid.cols, task.grid.rows),
  );

  // Measure the drawing area → a centered grid spec for the snap canvas.
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const grid: GridSpec | null = useMemo(
    () =>
      size
        ? computeGridSpec(size.w, size.h, task.grid.cols, task.grid.rows)
        : null,
    [size, task.grid.cols, task.grid.rows],
  );

  // Each finished segment advances one step; reaching `total` opens the
  // completion beat (R06-12). Committing happens once per finished segment, not
  // per pointer event (ADR-006).
  const onCanvasChange = useCallback(
    (d: GridDrawing) => {
      setDrawing(d);
      if (d.segments.length >= total) {
        setCompleting(true);
        vibrate('snap'); // soft confirm pulse on completion (R06-12)
      }
    },
    [total, vibrate],
  );

  const { setCanvas, undo } = useCanvas({
    grid: grid ?? undefined,
    onHaptic: vibrate, // crisp snap "click" on each new node (R06-8)
    onChange: onCanvasChange,
  });

  // The visible card is driven by how many segments are committed, so drawing a
  // line auto-advances and Undo regresses for free (no separate step state).
  const step = Math.min(drawing.segments.length, total - 1);
  const canUndo = drawing.segments.length > 0;

  const onUndo = useCallback(() => {
    undo(); // revert the last committed segment; the step card follows the count (R06-5)
  }, [undo]);

  const finish = useCallback(() => {
    saveMode2Drawing(drawing); // grid segments + grid spec (R06-13)
    go('stress2');
  }, [saveMode2Drawing, drawing, go]);

  return (
    <main
      data-testid="screen-mode2"
      className="relative flex h-full flex-col px-5 pb-6 pt-4"
    >
      <FlowProgress className="self-start" />

      {/* Inspection seam for E2E: the live grid geometry + committed drawing. */}
      {grid && (
        <div data-testid="mode2-grid-spec" hidden>
          {JSON.stringify(grid)}
        </div>
      )}
      <div data-testid="mode2-drawing" hidden>
        {JSON.stringify(drawing)}
      </div>
      {/* The session's authored step segments — lets E2E drive any subject in
            the (now-closed) task pool without hard-coding one. */}
      <div data-testid="mode2-steps" hidden>
        {JSON.stringify(steps.map((s) => s.segment))}
      </div>

      <StepInstruction
        className="mt-4 flex-1"
        label={strings.mode2.stepLabel(step + 1, total)}
        instruction={steps[step]?.text ?? ''}
        undoLabel={strings.common.undo}
        canUndo={canUndo}
        onUndo={onUndo}
        mascotMood="clear"
        mascotLabel={step === 0 ? giver.clearIntro : undefined}
        hideControls={completing}
      >
        <div
          ref={areaRef}
          className="absolute inset-0 overflow-hidden rounded-card bg-anchorBg"
        >
          {grid && (
            <canvas
              ref={setCanvas}
              data-testid="mode2-canvas"
              aria-label={strings.mode2.canvasLabel}
              className="absolute inset-0 h-full w-full touch-none"
            />
          )}
        </div>
      </StepInstruction>

      {completing && (
        <GiverBeat
          mood="beaming"
          line={giver.perfect}
          continueLabel={strings.common.continue}
          onDone={finish}
          testId="mode2-complete"
        />
      )}
    </main>
  );
}
