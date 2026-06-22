/**
 * Canvas rendering (PRD-003 R03-4/R03-5, _docs/04 §2.4–2.5).
 *
 * Pure, framework-free draw routines shared by the live `useCanvas` loop *and*
 * the read-only previews (reflection / history). Because both paths use these,
 * a saved drawing always re-renders exactly as it was drawn.
 */
import type { GridDrawing, GridNode } from '../types/session';
import type { GridSpec } from './snap';
import { nodeToPixel } from './snap';
import { tokens } from '../styles/tokens';

// Engine palette, sourced from the design tokens (DEBT-004) — the single source
// of truth for the visual language. `tokens.ts` is plain data with no runtime
// deps, so the engine stays pure/framework-free while a token change now
// propagates to the canvas instead of silently diverging.
const INK = tokens.color.ink; // committed segments (#0f172a)
const GRID_NODE = tokens.guidance.targetNode; // high-contrast grid nodes & target
const GUIDE_START = tokens.guidance.startNode; // pulsing start node

export function clear(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h);
}

export function drawGrid(ctx: CanvasRenderingContext2D, g: GridSpec): void {
  ctx.save();
  ctx.fillStyle = GRID_NODE;
  for (let c = 0; c < g.cols; c++) {
    for (let r = 0; r < g.rows; r++) {
      const x = g.originX + c * g.cell;
      const y = g.originY + r * g.cell;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawGridDrawing(
  ctx: CanvasRenderingContext2D,
  d: GridDrawing,
  g: GridSpec,
): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  for (const seg of d.segments) {
    const a = nodeToPixel(seg.from, g);
    const b = nodeToPixel(seg.to, g);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Mode 2 guidance: highlight the current step's *start* node so the player can
 * SEE exactly where to begin the line (the literal step text still says where to
 * go — ADR-015 keeps the canvas itself identical to Mode 1; only this anchor and
 * the step pager differ). A pulsing halo expands+fades around a solid anchor dot.
 * `phase` (0..1) drives the pulse — pass `(elapsed % period) / period` from the
 * rAF loop; pass a fixed phase to draw a single static highlight (reduced motion).
 */
export function drawStartHighlight(
  ctx: CanvasRenderingContext2D,
  node: GridNode,
  g: GridSpec,
  phase: number,
): void {
  const p = nodeToPixel(node, g);
  const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2); // 0..1

  ctx.save();
  // expanding, fading halo ring — draws the eye to "start here"
  ctx.strokeStyle = GUIDE_START;
  ctx.globalAlpha = 0.45 * (1 - pulse);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 8 + 7 * pulse, 0, Math.PI * 2);
  ctx.stroke();

  // solid anchor dot — sits on top of the grid node, clearly the start point
  ctx.globalAlpha = 1;
  ctx.fillStyle = GUIDE_START;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Reflection: draw the *intended* result faintly behind the player's Mode 1
 * attempt so the gap is visible (the target reveal). Render this FIRST, then the
 * player's attempt on top.
 */
export function drawTargetGhost(
  ctx: CanvasRenderingContext2D,
  target: GridDrawing,
  g: GridSpec,
): void {
  ctx.save();
  ctx.globalAlpha = 0.22;
  drawGridDrawing(ctx, target, g);
  ctx.restore();
}
