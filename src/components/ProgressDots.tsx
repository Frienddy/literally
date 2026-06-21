/**
 * A row of dots showing position within a sequence (PRD-004 R04-8). Dots up to and
 * including `current` are filled — matches both Mode 1's `●○○○○` and Mode 2's
 * `●●●○○` (_docs/06 §3.2/§3.4). Presentational only.
 */
export interface ProgressDotsProps {
  total: number;
  /** 0-based index of the current step; everything ≤ this is filled. -1 = none. */
  current: number;
  className?: string;
  'aria-label'?: string;
}

export function ProgressDots({
  total,
  current,
  className = '',
  'aria-label': ariaLabel,
}: ProgressDotsProps) {
  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `Step ${current + 1} of ${total}`}
      className={`flex items-center gap-1.5 ${className}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={`h-2 w-2 rounded-full ${
            i <= current ? 'bg-text' : 'bg-textMuted/40'
          }`}
        />
      ))}
    </div>
  );
}
