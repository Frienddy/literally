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
  // Layout reflows between portrait and landscape via grid-template-areas (ADR-014)
  // without changing DOM order: portrait stacks card → canvas → controls; the
  // `wide:` landscape variant puts the canvas on the left (spanning both rows) with
  // the persistent step card top-right and the Undo/Next controls bottom-right.
  return (
    <section
      className={
        'grid min-h-0 grid-cols-1 gap-4 ' +
        "grid-rows-[auto_minmax(0,1fr)_auto] [grid-template-areas:'card'_'canvas'_'controls'] " +
        'wide:grid-cols-[minmax(0,1fr)_20rem] wide:grid-rows-[auto_minmax(0,1fr)] wide:gap-x-6 ' +
        "wide:[grid-template-areas:'canvas_card'_'canvas_controls'] " +
        className
      }
    >
      <div className="[grid-area:card]">
        <StepCard
          label={label}
          hint={instruction}
          lead={<GuideMascot mood={mascotMood} label={mascotLabel} />}
        />
      </div>

      <div className="relative min-h-0 [grid-area:canvas]">{children}</div>

      {!hideControls && (
        <div className="flex gap-3 [grid-area:controls] wide:self-end">
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
