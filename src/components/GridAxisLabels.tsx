/**
 * Mode 2 numbered grid axes (PRD-006, ADR-015).
 *
 * A transparent, non-interactive canvas stacked over the drawing surface that
 * numbers every row and column in the gutter around the grid (1-based), so the
 * coordinate-based steps ("start at row 6, col 3") name a place the player can find.
 * The current step's start row/col are bolded so the referenced coordinates pop.
 *
 * Static (no animation): it redraws only when the geometry or the highlighted
 * coordinate changes. `pointer-events-none` + `aria-hidden` — the labels are a
 * visual aid layered on the canvas, which already carries the accessible name; they
 * share the canvas's `GridSpec` so the numbers line up exactly with their cells.
 */
import { useEffect, useRef } from 'react';
import type { GridSpec } from '../engine/snap';
import { clear, drawAxisLabels } from '../engine/render';

export interface GridAxisLabelsProps {
  grid: GridSpec;
  /** Current step's start row to bold (0-based), or `null` for none. */
  highlightRow?: number | null;
  /** Current step's start col to bold (0-based), or `null` for none. */
  highlightCol?: number | null;
  className?: string;
}

export function GridAxisLabels({
  grid,
  highlightRow = null,
  highlightCol = null,
  className = '',
}: GridAxisLabelsProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // jsdom / unsupported — labels are an enhancement, never required
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 1 unit = 1 CSS px (matches the grid spec)

    clear(ctx, rect.width, rect.height);
    drawAxisLabels(ctx, grid, { row: highlightRow, col: highlightCol });
  }, [grid, highlightRow, highlightCol]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-testid="mode2-axis-labels"
      className={`pointer-events-none ${className}`}
    />
  );
}
