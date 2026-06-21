import { describe, it, expect } from 'vitest';
import { applyWobble, type WobbleConfig } from '../../src/engine/wobble';
import type { Point } from '../../src/types/session';

const cfg: WobbleConfig = { amplitude: 4, frequency: 0.15 };

describe('applyWobble', () => {
  it('returns the point unchanged when there is no previous point', () => {
    const p: Point = { x: 10, y: 20 };
    expect(applyWobble(p, null, 1, 0, cfg)).toBe(p);
  });

  it('is deterministic: same seed + input → identical output', () => {
    const p: Point = { x: 30, y: 40 };
    const prev: Point = { x: 20, y: 40 };
    const a = applyWobble(p, prev, 12345, 7.5, cfg);
    const b = applyWobble(p, prev, 12345, 7.5, cfg);
    expect(a).toEqual(b);
  });

  it('different seeds generally produce different displacements', () => {
    const p: Point = { x: 30, y: 40 };
    const prev: Point = { x: 20, y: 40 };
    const a = applyWobble(p, prev, 1, 7.5, cfg);
    const b = applyWobble(p, prev, 9999, 7.5, cfg);
    expect(a).not.toEqual(b);
  });

  it('never displaces a point by more than the amplitude', () => {
    const prev: Point = { x: 0, y: 0 };
    // Sample many positions along a stroke and assert the bound holds.
    for (let i = 0; i < 200; i++) {
      const p: Point = { x: i, y: i * 0.5 };
      const out = applyWobble(p, prev, 42, i, cfg);
      const displacement = Math.hypot(out.x - p.x, out.y - p.y);
      expect(displacement).toBeLessThanOrEqual(cfg.amplitude + 1e-9);
    }
  });

  it('displaces perpendicular to the travel direction', () => {
    // Horizontal travel → displacement must be (near) vertical only.
    const prev: Point = { x: 0, y: 0 };
    const p: Point = { x: 10, y: 0 };
    const out = applyWobble(p, prev, 5, 3, cfg);
    expect(out.x).toBeCloseTo(p.x, 9); // no movement along travel axis
    expect(out.y).not.toBe(p.y); // shifted on the perpendicular axis
  });
});
