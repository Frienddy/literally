/**
 * Mode 2's one-step-at-a-time instruction card (PRD-004 R04-8, _docs/06 §3.4).
 * Exactly one is visible at a time; the text is big and high-contrast (`text-step`)
 * — the deliberate opposite of Mode 1's fading vague block. Presentational only;
 * the real step sequence + on-grid guidance is PRD-006.
 */
import type { ReactNode } from 'react';

export interface StepCardProps {
  /** e.g. "Step 1 of 8" — composed by the caller from content. */
  label: string;
  /** The literal instruction for this step. */
  hint: string;
  /** Optional leading element (the mascot, a direction icon). */
  lead?: ReactNode;
  className?: string;
}

export function StepCard({ label, hint, lead, className = '' }: StepCardProps) {
  return (
    <div className={`rounded-card bg-surface p-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-textMuted">
        {lead}
        <span>{label}</span>
      </div>
      {/* Reserve a constant two-line slot (2 × lineRelaxed 1.6 = 3.2em) so the
          card height stays fixed as steps swap between one- and two-line
          instructions — otherwise the card grows/shrinks and the canvas below
          jumps between steps. */}
      <p className="mt-2 min-h-[3.2em] text-step text-text">{hint}</p>
    </div>
  );
}
