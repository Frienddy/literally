/**
 * The instruction-giver — "the grown-up" (PRD-004 R04-8, _docs/06 §1.8). A warm
 * guide, never a villain: only the *clarity* of the ask changes between modes, and
 * difficulty is always the instructions' fault, never the player's (ethics,
 * _docs/07 §2).
 *
 * Art is the Frienddy mascot (`public/mascot.svg`), referenced by absolute public
 * path like the PWA icons. The `mood` prop is kept for call-site intent (vague/clear
 * during the modes, `puzzled` for Mode 1's "not quite right" beat, `beaming` for
 * Mode 2 completion) but no longer swaps the artwork — one friendly face throughout.
 */
export type GuideMood = 'vague' | 'clear' | 'puzzled' | 'beaming';

/** `'md'` fits inline instruction beats; `'lg'` is the hero size for Welcome. */
export type GuideSize = 'md' | 'lg';

const SIZE: Record<GuideSize, string> = {
  md: 'h-10 w-10',
  lg: 'h-24 w-24',
};

export interface GuideMascotProps {
  mood?: GuideMood;
  /** Optional caption rendered beside the mascot (e.g. the giver's line). */
  label?: string;
  size?: GuideSize;
  className?: string;
}

export function GuideMascot({
  label,
  size = 'md',
  className = '',
}: GuideMascotProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/mascot.svg"
        alt="the grown-up"
        className={`${SIZE[size]} shrink-0`}
      />
      {label && <span className="text-sm text-textMuted">{label}</span>}
    </div>
  );
}
