/**
 * Mode 2 — "Anchor Point" (PRD-006, _docs/01 §4, _docs/06 §3.4). The structured
 * half of the core contrast: a high-contrast pixel-paint canvas with **numbered
 * rows and columns**, one literal, coordinate-based instruction at a time ("start at
 * row 6, col 3: fill 4 squares → with color 1 (black)"), explicit progress, full
 * Undo, crisp confirming haptics, **no timers**, and a calm completion moment. The
 * player reads the coordinates off the numbered axes, **picks the named color
 * themselves** from the numbered palette, and fills the squares — there is no on-grid
 * cell highlight; the clarity comes from the literal instruction + numbered grid, not
 * from the app pointing at the answer. Each step is a short horizontal *run*; filling
 * its squares advances to the next step automatically — the instructions, not a
 * button, drive the rhythm. Emotional target: total control, predictability, mastery
 * — the opposite of Mode 1's nothing.
 *
 * Composition: `useCanvas({grid})` (PRD-003) owns the drawing as an imperative
 * island (ADR-006); `StepInstruction` paginates the authored run-based `mode2.steps`
 * (PRD-006 content) and hosts Undo + the numbered-color `ColorLegend` picker;
 * `GridAxisLabels` numbers the grid so the coordinates resolve. Filling the run's
 * squares advances the step; finishing the last opens `GiverBeat`'s "Perfect —
 * exactly right!" beat, after which the drawing is saved and the flow advances to
 * Feedback #2. Mode 1 and Mode 2 share the same pixel-paint canvas (ADR-015) — the
 * numbered axes, the numbered palette and the step pager are the only differences the
 * player meets.
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useDraft } from '../../store/selectors';
import { useCanvas } from '../../hooks/useCanvas';
import { useHaptics } from '../../hooks/useHaptics';
import { computeGridSpec } from '../../engine/grid';
import type { GridSpec } from '../../engine/snap';
import type { PixelDrawing } from '../../types/session';
import { config, DEFAULT_COLOR } from '../../config';
import { FlowProgress } from '../../components/FlowProgress';
import { StepInstruction } from '../../components/StepInstruction';
import { GridAxisLabels } from '../../components/GridAxisLabels';
import { ColorLegend } from '../../components/ColorLegend';
import { GiverBeat } from '../../components/GiverBeat';
import { resolveTask } from '../../content/tasks';
import { giver } from '../../content/giver.copy';
import { strings } from '../../content/strings';

const emptyPixel = (cols: number, rows: number): PixelDrawing => ({
  kind: 'pixel',
  cells: [],
  grid: { cols, rows },
});

export function AnchorPointScreen() {
  const go = useGameStore((s) => s.go);
  const saveMode2Drawing = useGameStore((s) => s.saveMode2Drawing);
  const draft = useDraft();
  const task = resolveTask(draft?.task_id ?? 'droid');
  const { steps } = task;
  // Steps are runs; the canvas fills cells, so completion counts *cells*, while the
  // "Step X of N" pager counts *runs*.
  const totalSteps = steps.length;
  const totalCells = useMemo(
    () => steps.reduce((sum, s) => sum + s.length, 0),
    [steps],
  );

  const { vibrate } = useHaptics();

  const [completing, setCompleting] = useState(false);
  // The player picks the color each step names — Mode 2 no longer dictates it. Seed
  // the default swatch; the legend is the controlled picker.
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  // The committed drawing is updated once per finished stroke (not per pointer
  // event — ADR-006), then saved once at completion (R06-13).
  const [drawing, setDrawing] = useState<PixelDrawing>(() =>
    emptyPixel(task.grid.cols, task.grid.rows),
  );

  // Measure the drawing area → a centered grid spec for the snap canvas. Mode 2
  // uses the wider `labelPad` so the numbered row/col labels have room in the gutter.
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
        ? computeGridSpec(
            size.w,
            size.h,
            task.grid.cols,
            task.grid.rows,
            config.grid.labelPad,
          )
        : null,
    [size, task.grid.cols, task.grid.rows],
  );

  // Each filled square advances the run pager; filling the final square opens the
  // completion beat (R06-12). Committing happens once per finished stroke (ADR-006).
  const onCanvasChange = useCallback(
    (d: PixelDrawing) => {
      setDrawing(d);
      if (d.cells.length >= totalCells) {
        setCompleting(true);
        vibrate('snap'); // soft confirm pulse on completion (R06-12)
      }
    },
    [totalCells, vibrate],
  );

  // The visible step is driven by how many squares are filled: walk the runs until
  // the filled count lands inside one. Painting a square auto-advances and Undo
  // regresses for free (no separate step state).
  const filled = drawing.cells.length;
  let acc = 0;
  let stepIdx = 0;
  while (stepIdx < steps.length && filled >= acc + steps[stepIdx].length) {
    acc += steps[stepIdx].length;
    stepIdx++;
  }
  const step = Math.min(stepIdx, totalSteps - 1);
  const run = steps[step];
  const canUndo = filled > 0;

  const { setCanvas, undo } = useCanvas({
    grid: grid ?? undefined,
    color, // the player's chosen swatch
    singleCell: true, // guided: one deliberate square per tap, no drag-fill
    onHaptic: vibrate, // crisp confirm "click" on each filled square (R06-8)
    onChange: onCanvasChange,
  });

  const onUndo = useCallback(() => {
    undo(); // revert the last filled square; the step pager follows the count (R06-5)
  }, [undo]);

  const finish = useCallback(() => {
    saveMode2Drawing(drawing); // painted cells + grid spec (R06-13)
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
      {/* The session's authored cells in fill order ({cell, color}) — lets E2E drive
            any subject in the (now-closed) task pool by tapping each cell, without
            hard-coding one. The run-aware view is the `mode2-runs` seam below. */}
      <div data-testid="mode2-steps" hidden>
        {JSON.stringify(
          task.target.cells.map((c) => ({
            cell: { col: c.col, row: c.row },
            color: c.color,
          })),
        )}
      </div>
      <div data-testid="mode2-runs" hidden>
        {JSON.stringify(
          steps.map((s) => ({
            start: s.start,
            length: s.length,
            cells: s.cells,
            color: s.color,
            colorIndex: s.colorIndex,
          })),
        )}
      </div>

      <StepInstruction
        className="mt-3 flex-1 wide:mt-4"
        label={strings.mode2.stepLabel(step + 1, totalSteps)}
        instruction={run?.text ?? ''}
        undoLabel={strings.common.undo}
        canUndo={canUndo}
        onUndo={onUndo}
        mascotMood="clear"
        mascotLabel={step === 0 ? giver.clearIntro : undefined}
        hideControls={completing}
        legend={<ColorLegend selected={color} onSelect={setColor} />}
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
                aria-label={strings.mode2.canvasLabel}
                className="absolute inset-0 h-full w-full touch-none"
              />
              <GridAxisLabels
                grid={grid}
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
  );
}
