import { describe, it, expect } from 'vitest';
import { dist, simplify, quantize } from '../../src/engine/geometry';
import type { Point } from '../../src/types/session';

describe('dist', () => {
  it('computes euclidean distance', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(dist({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });
});

describe('simplify (RDP)', () => {
  it('returns input unchanged when fewer than 3 points', () => {
    const one: Point[] = [{ x: 0, y: 0 }];
    const two: Point[] = [
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ];
    expect(simplify(one)).toBe(one);
    expect(simplify(two)).toBe(two);
  });

  it('collapses near-collinear points to the two endpoints', () => {
    const line: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0.1 },
      { x: 2, y: 0 },
      { x: 3, y: 0.1 },
      { x: 4, y: 0 },
    ];
    const out = simplify(line, 1.2);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[1]).toEqual({ x: 4, y: 0 });
  });

  it('keeps points that deviate beyond epsilon (shape preserved)', () => {
    const corner: Point[] = [
      { x: 0, y: 0 },
      { x: 5, y: 20 }, // sharp deviation — must be kept
      { x: 10, y: 0 },
    ];
    const out = simplify(corner, 1.2);
    expect(out).toHaveLength(3);
    expect(out).toContainEqual({ x: 5, y: 20 });
  });

  it('reduces the point count of a noisy near-straight stroke', () => {
    const noisy: Point[] = Array.from({ length: 50 }, (_, i) => ({
      x: i,
      y: (i % 2) * 0.2, // sub-epsilon jitter
    }));
    const out = simplify(noisy, 1.2);
    expect(out.length).toBeLessThan(noisy.length);
    // endpoints preserved
    expect(out[0]).toEqual(noisy[0]);
    expect(out[out.length - 1]).toEqual(noisy[noisy.length - 1]);
  });
});

describe('quantize', () => {
  it('rounds coordinates to integers', () => {
    expect(quantize([{ x: 1.4, y: 2.6 }])).toEqual([{ x: 1, y: 3 }]);
    expect(quantize([{ x: 2.5, y: -1.4 }])).toEqual([{ x: 3, y: -1 }]);
  });

  it('drops the optional t field (only x/y survive)', () => {
    const out = quantize([{ x: 1.1, y: 1.9, t: 123 }]);
    expect(out[0]).toEqual({ x: 1, y: 2 });
    expect('t' in out[0]).toBe(false);
  });
});
