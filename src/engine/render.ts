/**
 * Canvas rendering (PRD-003 R03-4/R03-5, _docs/04 §2.4–2.5).
 *
 * Pure, framework-free draw routines shared by the live `useCanvas` loop *and*
 * the read-only previews (reflection / history / examples). Because both paths use
 * these, a saved drawing always re-renders exactly as it was painted.
 *
 * The surface is a grid of square *cells* (pixel art): faint outlines mark the
 * cells, each filled cell is a solid color rectangle, and Mode 2 numbers the axes —
 * the player reads the coordinates and finds each square (no on-grid cell highlight).
 */
import type { PixelDrawing, GridNode } from '../types/session';
import type { GridSpec } from './snap';
import { cellOrigin } from './snap';
import { tokens } from '../styles/tokens';

// Engine palette, sourced from the design tokens (DEBT-004) — the single source
// of truth for the visual language. `tokens.ts` is plain data with no runtime
// deps, so the engine stays pure/framework-free while a token change now
// propagates to the canvas instead of silently diverging.
const GRID_LINE = tokens.color.gridLine; // faint cell outlines ("pixel paper")
const GUIDE_START = tokens.guidance.startNode; // pulsing Mode-2 target anchor
const AXIS_LABEL = tokens.color.textMuted; // Mode-2 row/col numbers
const AXIS_LABEL_HI = tokens.guidance.startNode; // the current step's row/col
const LABEL_FONT = tokens.font.body;

export function clear(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h);
}

/** The "pixel paper": faint gridlines outlining every cell the player can fill. */
export function drawGrid(ctx: CanvasRenderingContext2D, g: GridSpec): void {
  ctx.save();
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const right = g.originX + g.cols * g.cell;
  const bottom = g.originY + g.rows * g.cell;
  for (let c = 0; c <= g.cols; c++) {
    const x = g.originX + c * g.cell;
    ctx.moveTo(x, g.originY);
    ctx.lineTo(x, bottom);
  }
  for (let r = 0; r <= g.rows; r++) {
    const y = g.originY + r * g.cell;
    ctx.moveTo(g.originX, y);
    ctx.lineTo(right, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** Fill every painted cell with its color — the drawing itself. */
export function drawPixelDrawing(
  ctx: CanvasRenderingContext2D,
  d: PixelDrawing,
  g: GridSpec,
): void {
  ctx.save();
  for (const cell of d.cells) {
    ctx.fillStyle = cell.color;
    const o = cellOrigin(cell, g);
    ctx.fillRect(o.x, o.y, g.cell, g.cell);
  }
  ctx.restore();
}

/**
 * Mode 2 guidance: highlight the current step's *target* cell so the player can
 * SEE exactly which square to fill (the literal step text still says which color —
 * ADR-015 keeps the canvas itself identical to Mode 1; only this anchor and the
 * step pager differ). A pulsing halo expands+fades around a solid cell outline.
 * `phase` (0..1) drives the pulse — pass `(elapsed % period) / period` from the
 * rAF loop; pass a fixed phase to draw a single static highlight (reduced motion).
 */
export function drawTargetHighlight(
  ctx: CanvasRenderingContext2D,
  cell: GridNode,
  g: GridSpec,
  phase: number,
): void {
  const o = cellOrigin(cell, g);
  const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2); // 0..1

  ctx.save();
  // expanding, fading halo ring — draws the eye to "fill here"
  ctx.strokeStyle = GUIDE_START;
  ctx.globalAlpha = 0.5 * (1 - pulse);
  ctx.lineWidth = 3;
  const grow = 2 + 6 * pulse;
  ctx.strokeRect(o.x - grow, o.y - grow, g.cell + grow * 2, g.cell + grow * 2);

  // solid inner outline — marks the exact cell to fill
  ctx.globalAlpha = 1;
  ctx.lineWidth = 3;
  ctx.strokeRect(o.x + 1.5, o.y + 1.5, g.cell - 3, g.cell - 3);
  ctx.restore();
}

/**
 * Mode 2 guidance: number every row + column in the gutter around the grid so the
 * coordinate-based steps ("start at row 6, col 3") name a place the player can find.
 * Numbers are 1-based to match the step text + color legend. `highlight` bolds the
 * current step's start row/col so the referenced coordinates pop. Drawn on the
 * guidance overlay (the paint canvas clears itself each frame) from the shared
 * `GridSpec`, so the labels line up exactly with the cells they index.
 */
export function drawAxisLabels(
  ctx: CanvasRenderingContext2D,
  g: GridSpec,
  highlight?: { row?: number | null; col?: number | null },
): void {
  const fontPx = Math.max(8, Math.min(12, Math.round(g.cell * 0.55)));
  const hiRow = highlight?.row ?? null;
  const hiCol = highlight?.col ?? null;
  ctx.save();
  ctx.textBaseline = 'middle';

  // Column numbers, centered in the top gutter above each column.
  for (let c = 0; c < g.cols; c++) {
    const on = c === hiCol;
    ctx.font = `${on ? '700 ' : ''}${fontPx}px ${LABEL_FONT}`;
    ctx.fillStyle = on ? AXIS_LABEL_HI : AXIS_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText(
      String(c + 1),
      g.originX + (c + 0.5) * g.cell,
      g.originY - fontPx,
    );
  }
  // Row numbers, right-aligned just left of each row.
  for (let r = 0; r < g.rows; r++) {
    const on = r === hiRow;
    ctx.font = `${on ? '700 ' : ''}${fontPx}px ${LABEL_FONT}`;
    ctx.fillStyle = on ? AXIS_LABEL_HI : AXIS_LABEL;
    ctx.textAlign = 'right';
    ctx.fillText(
      String(r + 1),
      g.originX - Math.max(4, fontPx * 0.4),
      g.originY + (r + 0.5) * g.cell,
    );
  }
  ctx.restore();
}

/**
 * Reflection: draw the *intended* result faintly behind the player's Mode 1
 * attempt so the gap is visible (the target reveal). Render this FIRST, then the
 * player's attempt on top.
 */
export function drawTargetGhost(
  ctx: CanvasRenderingContext2D,
  target: PixelDrawing,
  g: GridSpec,
): void {
  ctx.save();
  ctx.globalAlpha = 0.25;
  drawPixelDrawing(ctx, target, g);
  ctx.restore();
}
