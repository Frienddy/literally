/**
 * Mode 1 wobble (PRD-003 R03-2, FR-2, _docs/04 §2.2).
 *
 * Adds a small, organic, *perpendicular* displacement to each incoming point so
 * strokes look slightly shaky/unsteady — the tactile half of "lack of control."
 * Uses smooth value-noise (not white-noise jitter) seeded per stroke so a saved
 * drawing re-renders identically. `Math.random` is intentionally avoided here so
 * replays are deterministic.
 */
import type { Point } from '../types/session';

/** Cheap smooth 1-D value noise in [-1, 1], deterministic for a given seed. */
function valueNoise(seed: number, x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => {
    const s = Math.sin((n + seed) * 127.1) * 43758.5453;
    return s - Math.floor(s); // [0,1)
  };
  const a = h(i);
  const b = h(i + 1);
  const u = f * f * (3 - 2 * f); // smoothstep
  return (a + (b - a) * u) * 2 - 1; // → [-1,1)
}

export interface WobbleConfig {
  /** px of max sideways deviation (start ~3–4). */
  amplitude: number;
  /** how fast the wobble varies along the stroke (~0.15–0.18). */
  frequency: number;
}

/**
 * Displace `p` perpendicular to the local direction (prev→p) by seeded noise.
 * Returns `p` unchanged when there is no previous point (start of a stroke).
 * Magnitude of the displacement is always ≤ `cfg.amplitude`.
 */
export function applyWobble(
  p: Point,
  prev: Point | null,
  seed: number,
  travelled: number,
  cfg: WobbleConfig,
): Point {
  if (!prev) return p;

  const dx = p.x - prev.x;
  const dy = p.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  // perpendicular unit vector
  const nx = -dy / len;
  const ny = dx / len;
  const n = valueNoise(seed, travelled * cfg.frequency);

  return {
    x: p.x + nx * n * cfg.amplitude,
    y: p.y + ny * n * cfg.amplitude,
  };
}
