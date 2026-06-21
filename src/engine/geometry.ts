/**
 * Pure 2D geometry helpers for the drawing engine (PRD-003 R03-1, _docs/04 §2.1).
 *
 * Framework-free and side-effect-free so they are trivially unit-testable and
 * shared by the live canvas and the read-only previews.
 */
import type { Point } from '../types/session';

/** Euclidean distance between two points. */
export const dist = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Ramer–Douglas–Peucker simplification — shrinks freehand payloads before save
 * with no visible quality loss. Keeps the first and last points; drops interior
 * points that lie within `epsilon` px of the chord.
 */
export function simplify(points: Point[], epsilon = 1.2): Point[] {
  if (points.length < 3) return points;

  let maxD = 0;
  let idx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }

  if (maxD > epsilon) {
    const left = simplify(points.slice(0, idx + 1), epsilon);
    const right = simplify(points.slice(idx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

/** Perpendicular distance from point `p` to the line through `a`→`b`. */
function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

/** Round to integers to cut storage size with no visible loss. */
export const quantize = (pts: Point[]): Point[] =>
  pts.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
