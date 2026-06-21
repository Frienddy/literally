/**
 * The Mode 1 vague-instruction decay curve (PRD-005 R05-3). Pure + deterministic
 * so the fade is unit-testable without timers, and so `VagueInstruction` stays a
 * components-only module (kept out of the component to avoid mixing concerns).
 */
export interface FadeConfig {
  startDelayMs: number;
  durationMs: number;
  minOpacity: number;
}

/**
 * Opacity at `elapsedMs` into the fade: 1 until `startDelayMs`, then smoothstep
 * down to `minOpacity` over `durationMs`, clamped to the floor afterward.
 */
export function fadeOpacity(elapsedMs: number, cfg: FadeConfig): number {
  if (elapsedMs <= cfg.startDelayMs) return 1;
  const t = Math.min(1, (elapsedMs - cfg.startDelayMs) / cfg.durationMs);
  const eased = t * t * (3 - 2 * t); // smoothstep
  return 1 + (cfg.minOpacity - 1) * eased;
}
