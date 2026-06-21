/**
 * The instruction-giver — "the grown-up" (PRD-004 R04-8, _docs/06 §1.8). A warm
 * guide, never a villain: only the *clarity* of the ask changes between modes, and
 * difficulty is always the instructions' fault, never the player's (ethics,
 * _docs/07 §2).
 *
 * PLACEHOLDER art (OQ-11) — a token-styled face stands in until PRD-009 ships the
 * custom mascot set. `mood` selects the expression: vague/clear during the modes,
 * `puzzled` for Mode 1's "not quite right" beat, `beaming` for Mode 2 completion.
 */
export type GuideMood = 'vague' | 'clear' | 'puzzled' | 'beaming';

const FACE: Record<GuideMood, string> = {
  vague: '🙂',
  clear: '🙂',
  puzzled: '🤔',
  beaming: '😄',
};

export interface GuideMascotProps {
  mood?: GuideMood;
  /** Optional caption rendered beside the mascot (e.g. the giver's line). */
  label?: string;
  className?: string;
}

export function GuideMascot({
  mood = 'clear',
  label,
  className = '',
}: GuideMascotProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        role="img"
        aria-label="the grown-up"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-xl"
      >
        {FACE[mood]}
      </span>
      {label && <span className="text-sm text-textMuted">{label}</span>}
    </div>
  );
}
