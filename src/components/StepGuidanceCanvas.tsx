/**
 * Mode 2 on-grid guidance overlay (PRD-006 R06-7, _docs/04 §2.5, _docs/06 §3.4).
 *
 * A transparent, non-interactive canvas stacked over the drawing surface that
 * shows exactly where to go for the current step: the start node pulses and the
 * target move is ghosted, via the engine's pure `drawStepGuidance`. This is the
 * visual half of "with instruction" — the player can *see* the move, not just
 * read it. `pointer-events-none` so drawing passes straight through to the canvas
 * beneath; it shares the same `GridSpec` (and therefore pixel geometry).
 *
 * Honors `prefers-reduced-motion` (NFR-6): the pulse animation collapses to a
 * single static highlight — the guidance still reads, nothing oscillates.
 */
import { useEffect, useRef } from 'react';
import type { GridSegment } from '../types/session';
import type { GridSpec } from '../engine/snap';
import { clear, drawStepGuidance } from '../engine/render';

/** Pulse period (ms) for the start-node highlight. */
const PULSE_PERIOD_MS = 1400;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface StepGuidanceCanvasProps {
  grid: GridSpec;
  /** The current step's move to highlight, or `null` to show nothing. */
  segment: GridSegment | null;
  className?: string;
}

export function StepGuidanceCanvas({
  grid,
  segment,
  className = '',
}: StepGuidanceCanvasProps) {
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
      if (segment) drawStepGuidance(ctx, segment, grid, phase);
    };

    // Reduced motion: draw once at the pulse mid-point and stop (no rAF loop).
    if (prefersReducedMotion()) {
      render(0.25); // sin peak → fully-grown static node
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
  }, [grid, segment]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-testid="mode2-guidance"
      className={`pointer-events-none ${className}`}
    />
  );
}
