/**
 * Mode 2 start-point highlight overlay (PRD-006 R06-7, _docs/06 §3.4).
 *
 * A transparent, non-interactive canvas stacked over the drawing surface that
 * marks the current step's *start* node, so the player can see exactly where the
 * line begins — the visual anchor for "with instruction". This is deliberately
 * narrower than the old ghost-the-whole-move guidance (dropped in
 * `feat(mode2): auto-advance…`): the literal step text says where to GO, this
 * only shows where to START. `pointer-events-none` so drawing passes straight
 * through to the canvas beneath; it shares the same `GridSpec` (identical pixel
 * geometry).
 *
 * Honors `prefers-reduced-motion` (NFR-6): the pulse collapses to a single
 * static highlight — the anchor still reads, nothing oscillates.
 */
import { useEffect, useRef } from 'react';
import type { GridNode } from '../types/session';
import type { GridSpec } from '../engine/snap';
import { clear, drawStartHighlight } from '../engine/render';

/** Pulse period (ms) for the start-node highlight. */
const PULSE_PERIOD_MS = 1400;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface StepStartHighlightProps {
  grid: GridSpec;
  /** The current step's start node to highlight, or `null` to show nothing. */
  node: GridNode | null;
  className?: string;
}

export function StepStartHighlight({
  grid,
  node,
  className = '',
}: StepStartHighlightProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // jsdom / unsupported — guidance is enhancement, never required
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 1 unit = 1 CSS px (matches the grid spec)

    const render = (phase: number) => {
      clear(ctx, rect.width, rect.height);
      if (node) drawStartHighlight(ctx, node, grid, phase);
    };

    // Reduced motion: draw once at the pulse mid-point and stop (no rAF loop).
    if (prefersReducedMotion()) {
      render(0.25); // sin peak → fully-grown static highlight
      return;
    }

    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      render(((t - start) % PULSE_PERIOD_MS) / PULSE_PERIOD_MS);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [grid, node]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-testid="mode2-start-highlight"
      className={`pointer-events-none ${className}`}
    />
  );
}
