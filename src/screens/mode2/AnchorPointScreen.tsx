/**
 * Mode 2 — Anchor Point (PRD-004 R04-4 shell, _docs/06 §3.4). Wires the navigation
 * skeleton and the calm/ordered *look*: top-level progress, a single persistent
 * step card, full Undo/Next control, and the "fog clearing" reveal on entry
 * (`ModeTheme clearFrom="storm"`, R04-10). Exactly one step card shows at a time
 * and Next advances at the player's pace — no timer (_docs/06 §1.3 one decision).
 *
 * Out of scope here (PRD-006): the snap-to-grid canvas, the pulsing start node +
 * ghost target, crisp snap haptics, and the real per-task step sequence. The grid
 * and step count below are placeholders.
 */
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../../components/Button';
import { FlowProgress } from '../../components/FlowProgress';
import { GuideMascot } from '../../components/GuideMascot';
import { ModeTheme } from '../../components/ModeTheme';
import { StepCard } from '../../components/StepCard';
import { strings } from '../../content/strings';

const TOTAL_STEPS = 8; // placeholder; PRD-006 derives this from the task target

export function AnchorPointScreen() {
  const go = useGameStore((s) => s.go);
  const [step, setStep] = useState(1);
  const isLast = step >= TOTAL_STEPS;

  return (
    <ModeTheme mode="anchor" clearFrom="storm">
      <main
        data-testid="screen-mode2"
        className="flex h-full flex-col px-5 pb-6 pt-4"
      >
        <FlowProgress className="self-start" />

        <StepCard
          className="mt-4"
          label={strings.mode2.stepLabel(step, TOTAL_STEPS)}
          hint={isLast ? strings.mode2.complete : strings.mode2.stepHint}
          lead={<GuideMascot mood={isLast ? 'beaming' : 'clear'} />}
        />

        {/* Placeholder grid (PRD-006 mounts the snap-to-grid canvas here). */}
        <div
          className="mt-4 flex-1 rounded-card bg-anchorBg"
          data-testid="mode2-grid"
          aria-hidden
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            data-testid="mode2-undo"
          >
            {strings.common.undo}
          </Button>
          <Button
            onClick={() => (isLast ? go('stress2') : setStep((s) => s + 1))}
            data-testid="mode2-next"
          >
            {isLast ? strings.common.continue : strings.common.next}
          </Button>
        </div>
      </main>
    </ModeTheme>
  );
}
