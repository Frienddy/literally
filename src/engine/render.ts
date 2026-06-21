/**
 * Canvas rendering (PRD-003 R03-4/R03-5, _docs/04 §2.4–2.5).
 *
 * Pure, framework-free draw routines shared by the live `useCanvas` loop *and*
 * the read-only previews (reflection / history). Because both paths use these,
 * a saved drawing always re-renders exactly as it was drawn.
 */
import type {
  FreehandDrawing,
  GridDrawing,
  GridSegment,
} from '../types/session';
import type { GridSpec } from './snap';
import { nodeToPixel } from './snap';
import { tokens } from '../styles/tokens';

// Engine palette, sourced from the design tokens (DEBT-004) — the single source
// of truth for the visual language. `tokens.ts` is plain data with no runtime
// deps, so the engine stays pure/framework-free while a token change now
// propagates to the canvas instead of silently diverging.
const INK = tokens.color.ink; // committed strokes / segments (#0f172a)
const GRID_NODE = tokens.guidance.targetNode; // high-contrast grid nodes & target
const GUIDE_START = tokens.guidance.startNode; // pulsing start node
const GHOST_PATH = tokens.guidance.ghostPath; // faint target hint

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

export function drawFreehand(
  ctx: CanvasRenderingContext2D,
  d: FreehandDrawing,
  // Stroke colour. Defaults to the committed ink (used by saved previews on a
  // light surface). The live Mode 1 canvas passes a distinct `stormInk` so the
  // line stays legible on the dark storm background (DEBT-006).
  ink: string = INK,
): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink;
  for (const stroke of d.strokes) {
    if (stroke.points.length < 2) continue;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
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
 * Mode 2 guidance: pulse the current step's start node and ghost its target
 * move, so the player can SEE exactly where to go. `phase` (0..1) drives the
 * pulse — pass `(elapsed % period) / period` from the rAF loop.
 */
export function drawStepGuidance(
  ctx: CanvasRenderingContext2D,
  step: GridSegment,
  g: GridSpec,
  phase: number,
): void {
  const from = nodeToPixel(step.from, g);
  const to = nodeToPixel(step.to, g);

  ctx.save();
  // faint ghost of the target move
  ctx.strokeStyle = GHOST_PATH;
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // pulsing start node
  ctx.setLineDash([]);
  ctx.fillStyle = GUIDE_START;
  const r = 5 + 3 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
  ctx.beginPath();
  ctx.arc(from.x, from.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Reflection: draw the *intended* result faintly behind the player's Mode 1
 * attempt so the gap is visible (the target reveal). Render this FIRST, then the
 * freehand attempt on top.
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
