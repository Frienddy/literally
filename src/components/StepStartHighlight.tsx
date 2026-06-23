/**
 * Mode 2 target-square highlight overlay (PRD-006 R06-7, _docs/06 §3.4).
 *
 * A transparent, non-interactive canvas stacked over the drawing surface that
 * marks the current step's *target* cell, so the player can see exactly which
 * square to fill — the visual anchor for "with instruction". The literal step text
 * says which COLOR; this shows WHERE. `pointer-events-none` so painting passes
 * straight through to the canvas beneath; it shares the same `GridSpec` (identical
 * pixel geometry).
 *
 * Honors `prefers-reduced-motion` (NFR-6): the pulse collapses to a single
 * static highlight — the anchor still reads, nothing oscillates.
 */
import { useEffect, useRef } from 'react';
import type { GridNode } from '../types/session';
import type { GridSpec } from '../engine/snap';
import { clear, drawTargetHighlight } from '../engine/render';

/** Pulse period (ms) for the target-cell highlight. */
const PULSE_PERIOD_MS = 1400;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface StepStartHighlightProps {
  grid: GridSpec;
  /** The current step's target cell to highlight, or `null` to show nothing. */
  cell: GridNode | null;
  className?: string;
}

export function StepStartHighlight({
  grid,
  cell,
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
      if (cell) drawTargetHighlight(ctx, cell, grid, phase);
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
  }, [grid, cell]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-testid="mode2-start-highlight"
      className={`pointer-events-none ${className}`}
    />
  );
}
