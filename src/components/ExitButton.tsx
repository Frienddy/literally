/**
 * The persistent calm-exit for Mode 1 (PRD-004 R04-8, FR-22). Sensory safety
 * requires a way out that stays reachable the whole time (_docs/07). The confirm
 * dialog + reduce-intensity coupling are detailed in PRD-005/010; here it's the
 * shared affordance that fires `onExit`.
 */
import { strings } from '../content/strings';

export interface ExitButtonProps {
  onExit: () => void;
  label?: string;
  className?: string;
}

export function ExitButton({
  onExit,
  label = strings.common.exit,
  className = '',
}: ExitButtonProps) {
  return (
    <button
      type="button"
      onClick={onExit}
      aria-label={label}
      className={`inline-flex min-h-touch items-center gap-1 rounded-button px-3 text-sm text-textMuted active:text-text ${className}`}
    >
      <span aria-hidden>✕</span>
      {label}
    </button>
  );
}
