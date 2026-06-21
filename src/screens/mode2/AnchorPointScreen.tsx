/**
 * Mode 2 — "Anchor Point" (PRD-006, _docs/01 §4, _docs/06 §3.4). The structured
 * half of the core contrast: a high-contrast snap-to-grid canvas, one literal
 * instruction at a time, explicit progress, on-grid guidance (pulsing start node
 * + ghost target), full Undo, crisp confirming haptics, **no timers**, and a calm
 * completion moment. Emotional target: total control, predictability, mastery —
 * the opposite of Mode 1's nothing.
 *
 * Composition: `useCanvas({mode:'grid'})` (PRD-003) owns the drawing as an
 * imperative island (ADR-006); `StepInstruction` paginates the authored
 * `mode2.steps` (PRD-006 content); `StepGuidanceCanvas` overlays the guidance for
 * the current step; `GiverBeat` plays the "Perfect — exactly right!" beat, then
 * the drawing is saved and the flow advances to Feedback #2. The anchor theme +
 * storm→anchor "fog clearing" reveal come from `ModeTheme` (PRD-004, FR-23).
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
import { ModeTheme } from '../../components/ModeTheme';
import { StepInstruction } from '../../components/StepInstruction';
import { StepGuidanceCanvas } from '../../components/StepGuidanceCanvas';
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

  const [step, setStep] = useState(0); // 0-indexed current step card
  const [completing, setCompleting] = useState(false);
  // The committed drawing is updated once per finished segment (not per pointer
  // event — ADR-006), then saved once at completion (R06-13).
  const [drawing, setDrawing] = useState<GridDrawing>(() =>
    emptyGrid(task.grid.cols, task.grid.rows),
  );

  // Measure the drawing area → a centered grid spec shared by the snap canvas and
  // the guidance overlay so both derive identical geometry.
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

  const { setCanvas, undo } = useCanvas({
    mode: 'grid',
    grid: grid ?? undefined,
    onHaptic: vibrate, // crisp snap "click" on each new node (R06-8)
    onChange: (d) => {
      if (d.kind === 'grid') setDrawing(d);
    },
  });

  const isLast = step >= total - 1;
  const canUndo = drawing.segments.length > 0;
  // The move to highlight this step (hidden once the completion beat plays).
  const currentSegment = completing ? null : (steps[step]?.segment ?? null);

  const onUndo = useCallback(() => {
    undo(); // revert the last committed segment...
    setStep((s) => Math.max(0, s - 1)); // ...and return to the prior card (R06-5)
  }, [undo]);

  const onNext = useCallback(() => {
    if (isLast) {
      setCompleting(true);
      vibrate('snap'); // soft confirm pulse on completion (R06-12)
      return;
    }
    setStep((s) => Math.min(total - 1, s + 1));
  }, [isLast, total, vibrate]);

  const finish = useCallback(() => {
    saveMode2Drawing(drawing); // grid segments + grid spec (R06-13)
    go('stress2');
  }, [saveMode2Drawing, drawing, go]);

  return (
    <ModeTheme mode="anchor" clearFrom="storm">
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

        <StepInstruction
          className="mt-4 flex-1"
          label={strings.mode2.stepLabel(step + 1, total)}
          instruction={steps[step]?.text ?? ''}
          nextLabel={isLast ? strings.mode2.finish : strings.common.next}
          undoLabel={strings.common.undo}
          canUndo={canUndo}
          onNext={onNext}
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
              <>
                <canvas
                  ref={setCanvas}
                  data-testid="mode2-canvas"
                  className="absolute inset-0 h-full w-full touch-none"
                />
                <StepGuidanceCanvas
                  grid={grid}
                  segment={currentSegment}
                  className="absolute inset-0 h-full w-full"
                />
              </>
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
    </ModeTheme>
  );
}
