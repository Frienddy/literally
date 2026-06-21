/**
 * Mode 2 one-step-at-a-time pagination (PRD-006 R06-3…R06-6, _docs/06 §3.4).
 *
 * Lays out the structured experience: a single persistent, re-readable step card
 * on top, the drawing surface (`children`) in the middle, and the full-control
 * row — secondary **Undo** + the dominant **Next** CTA — on the bottom. Exactly
 * one card shows at a time and it never decays; advancing is the player's choice,
 * with **no timer and no auto-advance** (the deliberate opposite of Mode 1).
 *
 * Presentational/controlled: the screen owns the step index and drawing state and
 * passes resolved labels + handlers. "Undo Step" reverts the last segment *and*
 * returns to the prior card in one action (R06-5) — the screen wires both.
 */
import type { ReactNode } from 'react';
import { Button } from './Button';
import { StepCard } from './StepCard';
import { GuideMascot, type GuideMood } from './GuideMascot';

export interface StepInstructionProps {
  /** Composed progress label, e.g. "Step 3 of 9". */
  label: string;
  /** The literal instruction for the current step. */
  instruction: string;
  /** Resolved primary CTA label ("Next step", or "Finish" on the last step). */
  nextLabel: string;
  /** Resolved secondary control label ("Undo"). */
  undoLabel: string;
  /** Whether the Undo control is enabled (a drawn segment exists to revert). */
  canUndo: boolean;
  onNext: () => void;
  onUndo: () => void;
  /** The Grown-up's expression beside the card (calm/clear by default). */
  mascotMood?: GuideMood;
  /** Optional warm framing line shown beside the mascot (the clear ask). */
  mascotLabel?: string;
  /** Hide the control row (e.g. while the completion beat plays). */
  hideControls?: boolean;
  /** The drawing surface, laid out between the card and the controls. */
  children?: ReactNode;
  className?: string;
}

export function StepInstruction({
  label,
  instruction,
  nextLabel,
  undoLabel,
  canUndo,
  onNext,
  onUndo,
  mascotMood = 'clear',
  mascotLabel,
  hideControls = false,
  children,
  className = '',
}: StepInstructionProps) {
  return (
    <section className={`flex min-h-0 flex-col ${className}`}>
      <StepCard
        label={label}
        hint={instruction}
        lead={<GuideMascot mood={mascotMood} label={mascotLabel} />}
      />

      <div className="relative mt-4 min-h-0 flex-1">{children}</div>

      {!hideControls && (
        <div className="mt-4 flex gap-3">
          <Button
            variant="secondary"
            onClick={onUndo}
            disabled={!canUndo}
            data-testid="mode2-undo"
            className="flex-1"
          >
            {undoLabel}
          </Button>
          <Button
            onClick={onNext}
            data-testid="mode2-next"
            className="flex-[2]"
          >
            {nextLabel}
          </Button>
        </div>
      )}
    </section>
  );
}
