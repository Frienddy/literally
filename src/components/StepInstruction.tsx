/**
 * Mode 2 one-step-at-a-time pagination (PRD-006 R06-3…R06-6, _docs/06 §3.4).
 *
 * Lays out the structured experience: a single persistent, re-readable step card
 * on top, the drawing surface (`children`) in the middle, and the control row —
 * just **Undo** — on the bottom. Exactly one card shows at a time and it never
 * decays. Advancing is driven by the drawing itself: each finished line moves the
 * screen to the next step (the screen owns that wiring), with **no timer** — the
 * deliberate opposite of Mode 1.
 *
 * Presentational/controlled: the screen owns the step index and drawing state and
 * passes resolved labels + handlers. "Undo" reverts the last segment *and*
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
  /** Resolved Undo control label. */
  undoLabel: string;
  /** Whether the Undo control is enabled (a drawn segment exists to revert). */
  canUndo: boolean;
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
  undoLabel,
  canUndo,
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
  // the persistent step card top-right and the Undo control bottom-right.
  return (
    <section
      className={
        // Tighter row gaps on phones free vertical space for the canvas (the
        // binding axis in portrait); `wide:` restores the desktop spacing.
        'grid min-h-0 grid-cols-1 gap-3 wide:gap-4 ' +
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
        <div className="flex [grid-area:controls] wide:self-end">
          <Button
            variant="secondary"
            onClick={onUndo}
            disabled={!canUndo}
            data-testid="mode2-undo"
            className="flex-1"
          >
            {undoLabel}
          </Button>
        </div>
      )}
    </section>
  );
}
