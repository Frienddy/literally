/**
 * Mode 1 — Sensory Storm (PRD-004 R04-4 shell, _docs/06 §3.2). This PRD wires the
 * *navigation skeleton* and the storm *look* (via `ModeTheme`): progress, the
 * persistent calm Exit (FR-22), the vague giver ask, and a "Done" CTA that
 * advances the FSM.
 *
 * Out of scope here (PRD-005): the freehand+wobble canvas, the fading instruction
 * decay, the jittered fake notifications, the erratic haptics, and the "not quite
 * right" beat. The drawing area below is a placeholder.
 */
import { useGameStore } from '../../store/gameStore';
import { Button } from '../../components/Button';
import { ExitButton } from '../../components/ExitButton';
import { FlowProgress } from '../../components/FlowProgress';
import { GuideMascot } from '../../components/GuideMascot';
import { ModeTheme } from '../../components/ModeTheme';
import { strings } from '../../content/strings';
import { tokens } from '../../styles/tokens';

export function SensoryStormScreen() {
  const go = useGameStore((s) => s.go);

  return (
    <ModeTheme mode="storm">
      <main
        data-testid="screen-mode1"
        className="flex h-full flex-col px-5 pb-6 pt-4"
      >
        <div className="flex items-center justify-between">
          <FlowProgress />
          <ExitButton onExit={() => go('welcome')} />
        </div>

        <GuideMascot
          mood="vague"
          label={strings.mode1.giverAsk}
          className="mt-4"
        />
        <p className="mt-2 text-sm text-stormText">{strings.mode1.vague}</p>

        {/* Placeholder drawing area (PRD-005 mounts the freehand canvas here). */}
        <div
          className="mt-4 flex-1 rounded-card border border-white/5"
          style={{ backgroundColor: tokens.theme.storm.canvas }}
          aria-hidden
        />

        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary"
            onClick={() => go('stress1')}
            data-testid="mode1-done"
          >
            {strings.common.done}
          </Button>
        </div>
      </main>
    </ModeTheme>
  );
}
