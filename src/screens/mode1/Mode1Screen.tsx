/**
 * Mode 1 — "Without clear instruction" (PRD-005, _docs/01 §3, _docs/06 §3.2).
 *
 * The first half of the core contrast. Per ADR-015 it draws on the **same**
 * snap-to-grid dotted canvas as Mode 2 — same dots, same snapping, same Undo —
 * so the experience holds every tool constant and varies only the *instruction*:
 * here a single, vague, holistic ask ("draw a little robot droid…") with no counts, no
 * directions, no per-step guidance and no target. The player has to decide the
 * whole drawing from a fuzzy idea of the subject. Emotional target: *mild*
 * uncertainty — "I can't tell if I'm doing this right" — never distress.
 *
 * Composition mirrors Mode 2: `useCanvas` (PRD-003) owns the drawing as an
 * imperative island (ADR-006); a persistent `StepCard` shows the vague ask
 * (re-readable, never fading); `GiverBeat` plays the gently-puzzled "not quite
 * right" beat on Done, then the drawing is saved and the flow advances to
 * Feedback #1. The difference the player will *feel* is the absence of the
 * step-by-step help Mode 2 provides — not a different, harder tool.
 *
 * (Formerly "Sensory Storm": the wobble/fade/notification overload layer was
 * removed so the contrast is purely instruction clarity — see ADR-015.)
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useDraft } from '../../store/selectors';
import { useCanvas } from '../../hooks/useCanvas';
import { useHaptics } from '../../hooks/useHaptics';
import { computeGridSpec } from '../../engine/grid';
import type { GridSpec } from '../../engine/snap';
import type { GridDrawing } from '../../types/session';
import { Button } from '../../components/Button';
import { ExitButton } from '../../components/ExitButton';
import { FlowProgress } from '../../components/FlowProgress';
import { GuideMascot } from '../../components/GuideMascot';
import { GiverBeat } from '../../components/GiverBeat';
import { StepCard } from '../../components/StepCard';
import { resolveTask } from '../../content/tasks';
import { giver } from '../../content/giver.copy';
import { strings } from '../../content/strings';

const emptyGrid = (cols: number, rows: number): GridDrawing => ({
  kind: 'grid',
  segments: [],
  grid: { cols, rows },
});

export function Mode1Screen() {
  const go = useGameStore((s) => s.go);
  const saveMode1Drawing = useGameStore((s) => s.saveMode1Drawing);

  // The session's shared subject drives the vague ask (so an alien session asks for
  // an alien). Falls back to the droid if somehow opened without a draft.
  const draft = useDraft();
  const task = resolveTask(draft?.task_id ?? 'droid');

  const { vibrate } = useHaptics();

  const [completing, setCompleting] = useState(false);
  // The committed drawing is updated once per finished segment (not per pointer
  // event — ADR-006), then saved once on Done (R05-9).
  const [drawing, setDrawing] = useState<GridDrawing>(() =>
    emptyGrid(task.grid.cols, task.grid.rows),
  );

  // Measure the drawing area → a centered grid spec (same geometry as Mode 2).
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
    grid: grid ?? undefined,
    onHaptic: vibrate, // crisp snap on each new node — same canvas as Mode 2
    onChange: (d) => setDrawing(d),
  });

  const canUndo = drawing.segments.length > 0;

  const onDone = useCallback(() => setCompleting(true), []); // → the beat
  const finish = useCallback(() => {
    saveMode1Drawing(drawing); // grid segments + grid spec (R05-9)
    go('stress1');
  }, [saveMode1Drawing, drawing, go]);

  return (
    <main
      data-testid="screen-mode1"
      className="relative flex h-full flex-col px-5 pb-6 pt-4"
    >
      {/* Top chrome — the calm Exit safety rail stays reachable (R05-10). */}
      <div className="flex items-center justify-between">
        <FlowProgress />
        <ExitButton onExit={() => go('welcome')} />
      </div>

      {/* Inspection seam for E2E: live grid geometry + committed drawing. */}
      {grid && (
        <div data-testid="mode1-grid-spec" hidden>
          {JSON.stringify(grid)}
        </div>
      )}
      <div data-testid="mode1-drawing" hidden>
        {JSON.stringify(drawing)}
      </div>

      {/* Same layout grammar as Mode 2 (ADR-014), minus the step pager: a single
            persistent vague card, the shared snap canvas, and Undo + Done. */}
      <section
        className={
          // Tighter top margin + row gaps on phones give the canvas more height
          // (the binding axis on portrait); `wide:` restores the desktop spacing.
          'mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 wide:mt-4 wide:gap-4 ' +
          "grid-rows-[auto_minmax(0,1fr)_auto] [grid-template-areas:'card'_'canvas'_'controls'] " +
          'wide:grid-cols-[minmax(0,1fr)_20rem] wide:grid-rows-[auto_minmax(0,1fr)] wide:gap-x-6 ' +
          "wide:[grid-template-areas:'canvas_card'_'canvas_controls']"
        }
      >
        <div className="[grid-area:card]">
          <StepCard
            label={strings.mode1.taskLabel}
            hint={task.vague.block}
            lead={<GuideMascot mood="vague" label={giver.vagueAsk} />}
          />
        </div>

        <div
          ref={areaRef}
          className="relative min-h-0 overflow-hidden rounded-card bg-anchorBg [grid-area:canvas]"
        >
          {grid && (
            <canvas
              ref={setCanvas}
              data-testid="mode1-canvas"
              aria-label={strings.mode1.canvasLabel}
              className="absolute inset-0 h-full w-full touch-none"
            />
          )}
        </div>

        {!completing && (
          <div className="flex gap-3 [grid-area:controls] wide:self-end">
            <Button
              variant="secondary"
              onClick={undo}
              disabled={!canUndo}
              data-testid="mode1-undo"
              className="flex-1"
            >
              {strings.common.undo}
            </Button>
            <Button
              onClick={onDone}
              data-testid="mode1-done"
              className="flex-[2]"
            >
              {strings.mode1.doneLabel}
            </Button>
          </div>
        )}
      </section>

      {completing && (
        <GiverBeat
          mood="puzzled"
          line={giver.notQuiteRight}
          continueLabel={strings.common.continue}
          onDone={finish}
          testId="mode1-complete"
        />
      )}
    </main>
  );
}
