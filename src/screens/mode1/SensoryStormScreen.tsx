/**
 * Mode 1 — "Sensory Storm" (PRD-005, _docs/01 §3, _docs/06 §3.2). The "without
 * clear instruction" half of the core contrast: a blank, wobbly freehand canvas,
 * a single vague ask that fades from memory, erratic haptics while drawing, fake
 * notifications stealing focus, **no undo**, a slightly-too-small Done, and a
 * gently-puzzled "not quite right" beat on finish. Emotional target: *mild*
 * frustration, ambiguity, loss of control — never distress (golden rule).
 *
 * Composition: `useCanvas({mode:'freehand', wobble})` (PRD-003) owns the drawing
 * as an imperative island (ADR-006); `VagueInstruction` is the fading ask (R05-3);
 * `FakeNotifications` is the distraction layer (R05-4); `useHaptics` fires the
 * erratic move buzz (R05-5); `GiverBeat` plays the puzzled beat, then the drawing
 * is saved and the flow advances to Feedback #1. The storm theme (desaturated /
 * vignetted) comes from `ModeTheme` (PRD-004, FR-23).
 *
 * Sensory safety (R05-10/11/12): the calm **Exit** and the **reduce-intensity**
 * toggle stay reachable the whole time and survive the chaos; reducing intensity
 * verifiably softens all four channels — haptics (via `useHaptics`), notifications,
 * the text fade, and the vague-text contrast.
 */
import { useCallback, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useReducedIntensity } from '../../store/selectors';
import { useCanvas } from '../../hooks/useCanvas';
import { useHaptics } from '../../hooks/useHaptics';
import { config } from '../../config';
import { tokens } from '../../styles/tokens';
import type { FreehandDrawing } from '../../types/session';
import { Button } from '../../components/Button';
import { ExitButton } from '../../components/ExitButton';
import { FlowProgress } from '../../components/FlowProgress';
import { GuideMascot } from '../../components/GuideMascot';
import { GiverBeat } from '../../components/GiverBeat';
import { ModeTheme } from '../../components/ModeTheme';
import { VagueInstruction } from '../../components/VagueInstruction';
import { FakeNotifications } from '../../components/FakeNotifications';
import { mode1Content } from '../../content/mode1';
import { strings } from '../../content/strings';

const emptyFreehand = (): FreehandDrawing => ({
  kind: 'freehand',
  strokes: [],
  canvas: { width: 0, height: 0 },
});

export function SensoryStormScreen() {
  const go = useGameStore((s) => s.go);
  const saveMode1Drawing = useGameStore((s) => s.saveMode1Drawing);
  const setReducedIntensity = useGameStore((s) => s.setReducedIntensity);
  const reduced = useReducedIntensity();
  const { vibrate } = useHaptics();

  // The committed drawing is updated once per finished stroke (ADR-006 — not per
  // pointer event), then saved once on Done (R05-9). No undo anywhere (R05-2).
  const [drawing, setDrawing] = useState<FreehandDrawing>(emptyFreehand);
  const [completing, setCompleting] = useState(false);

  const { setCanvas } = useCanvas({
    mode: 'freehand',
    wobble: config.wobble,
    onHaptic: vibrate, // erratic move buzz; suppressed under reduced-intensity
    onChange: (d) => {
      if (d.kind === 'freehand') setDrawing(d);
    },
  });

  const onDone = useCallback(() => setCompleting(true), []); // → the beat
  const finish = useCallback(() => {
    saveMode1Drawing(drawing); // freehand strokes + capture size (R05-9)
    go('stress1');
  }, [saveMode1Drawing, drawing, go]);

  return (
    <ModeTheme mode="storm">
      <main
        data-testid="screen-mode1"
        className="relative flex h-full flex-col px-5 pb-6 pt-4"
      >
        {/* Top chrome — the safety rails survive the chaos (R05-10). */}
        <div className="flex items-center justify-between">
          <FlowProgress />
          <div className="flex items-center gap-1">
            <button
              type="button"
              data-testid="mode1-reduce-intensity"
              aria-pressed={reduced}
              onClick={() => setReducedIntensity(!reduced)}
              className="min-h-touch rounded-button px-3 text-sm text-textMuted active:text-text"
            >
              {reduced
                ? mode1Content.intensityReduced
                : mode1Content.reduceIntensity}
            </button>
            <ExitButton onExit={() => go('welcome')} />
          </div>
        </div>

        {/* Inspection seam for E2E: the committed freehand drawing (updated once
            per finished stroke, not per pointer event — ADR-006). */}
        <div data-testid="mode1-drawing" hidden>
          {JSON.stringify(drawing)}
        </div>

        {/* Reduced-intensity keeps the toast rail out of the canvas; full
            intensity lets it slide in over the top edge (R05-4/R05-11). */}
        <FakeNotifications
          items={mode1Content.notifications}
          reduced={reduced}
          active={!completing}
          className={
            reduced
              ? 'mt-2 min-h-[56px]'
              : 'pointer-events-none absolute inset-x-5 top-16'
          }
        />

        {/* Drawing area: full-bleed wobble canvas with the fading ask layered over
            the top. The overlay is pointer-events-none so you draw straight
            through it (R05-1/R05-3). */}
        <div
          className="relative mt-2 flex-1 overflow-hidden rounded-card border border-white/5"
          style={{ backgroundColor: tokens.theme.storm.canvas }}
        >
          <canvas
            ref={setCanvas}
            data-testid="mode1-canvas"
            aria-label={mode1Content.canvasLabel}
            className="absolute inset-0 h-full w-full touch-none"
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start gap-2 p-4">
            {/* The grown-up stays present; only the *words* fade (R05-6). */}
            <GuideMascot mood="vague" />
            <VagueInstruction
              ask={mode1Content.giverAsk}
              instruction={mode1Content.instruction}
              reduced={reduced}
              className="flex-1"
            />
          </div>

          {/* A single, slightly-too-small Done — still ≥44pt tappable (R05-7). */}
          <Button
            variant="secondary"
            onClick={onDone}
            data-testid="mode1-done"
            className="absolute bottom-3 right-3 px-4 text-sm"
          >
            {strings.common.done}
          </Button>
        </div>

        {completing && (
          <GiverBeat
            mood="puzzled"
            line={mode1Content.beat}
            continueLabel={strings.common.continue}
            onDone={finish}
            testId="mode1-complete"
          />
        )}
      </main>
    </ModeTheme>
  );
}
