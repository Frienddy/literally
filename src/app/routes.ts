/**
 * Navigation is a finite state machine inside the store (`screen` + `go`) — there
 * is intentionally **no URL router and no browser history** to swipe back through
 * (ADR-004, _docs/02 §3). This module owns the canonical FSM: the transition map,
 * the forward-path helper screens call for their primary CTA, and the top-level
 * flow-progress mapping (PRD-004 R04-2 / R04-7).
 */
import type { Screen } from '../store/gameStore';

/**
 * The allowed transitions out of each screen, mirroring the journey in
 * _docs/01 §7 / _docs/06 §2:
 *
 *   welcome → mode1 → stress1 → mode2 → stress2 → reflection → (history | welcome)
 *
 * Branches (history, play-again) are listed alongside the linear `next` step.
 * Some edges are driven by lifecycle actions rather than a bare `go` —
 * `welcome→mode1` is `startNewSession()` and `stress2→reflection` is
 * `finalizeSession()` — but the *destinations* are the same.
 */
export const TRANSITIONS: Record<Screen, Screen[]> = {
  welcome: ['mode1', 'history', 'examples'],
  mode1: ['stress1', 'welcome'], // welcome via calm Exit (FR-22)
  stress1: ['mode2'],
  mode2: ['stress2'],
  stress2: ['reflection'],
  reflection: ['welcome', 'history'],
  history: ['welcome', 'reflection'],
  // A standalone gallery of every task's finished drawing. Reachable only from
  // Welcome and returns there — it sits outside the linear play flow, so it has
  // no forward step and is not a counted FlowProgress step.
  examples: ['welcome'],
};

/** The single linear forward step each screen's primary CTA advances to. */
const FORWARD: Partial<Record<Screen, Screen>> = {
  welcome: 'mode1',
  mode1: 'stress1',
  stress1: 'mode2',
  mode2: 'stress2',
  stress2: 'reflection',
  reflection: 'welcome',
};

/** The next screen on the happy path, or `null` for terminal/branch-only screens. */
export const nextScreen = (screen: Screen): Screen | null =>
  FORWARD[screen] ?? null;

/**
 * The five top-level steps the `FlowProgress` indicator reflects (FR-21). Welcome
 * is the pre-roll and History is post-flow, so neither is a counted step.
 */
export const FLOW_STEPS: readonly Screen[] = [
  'mode1',
  'stress1',
  'mode2',
  'stress2',
  'reflection',
] as const;

/** Index of `screen` within {@link FLOW_STEPS}, or -1 if it isn't a flow step. */
export const flowStepIndex = (screen: Screen): number =>
  FLOW_STEPS.indexOf(screen);
