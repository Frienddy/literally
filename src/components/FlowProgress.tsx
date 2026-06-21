/**
 * Top-level 5-step indicator for the whole journey (PRD-004 R04-7, FR-21). Reads
 * the active screen from the store and maps it to a step via the FSM. Welcome (the
 * pre-roll) shows no fill; History reuses the final step's position.
 *
 * It subscribes to the narrowest slice (`screen`) so it never re-renders during a
 * stroke (NFR-1) — `screen` is stable while a mode is being drawn.
 */
import { FLOW_STEPS, flowStepIndex } from '../app/routes';
import { useScreen } from '../store/selectors';
import { ProgressDots } from './ProgressDots';

export function FlowProgress({ className = '' }: { className?: string }) {
  const screen = useScreen();
  const idx = flowStepIndex(screen);
  const current =
    idx >= 0 ? idx : screen === 'history' ? FLOW_STEPS.length - 1 : -1;

  return (
    <ProgressDots
      total={FLOW_STEPS.length}
      current={current}
      aria-label={`Progress: step ${Math.max(current + 1, 0)} of ${FLOW_STEPS.length}`}
      className={className}
    />
  );
}
