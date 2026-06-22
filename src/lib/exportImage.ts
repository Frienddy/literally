/**
 * Image export (PRD-008 R08-12, FR-14 — P2). Composes the Reflection comparison
 * — the intended target plus both attempts and the stress/confidence deltas —
 * onto an offscreen canvas and saves it as a PNG to the device.
 *
 * Local-only, no network (NFR-4): we render with the same pure `engine/render.ts`
 * routines the previews use, call `canvas.toBlob`, and download via an object URL.
 * Nothing leaves the device. Feature-detected (`isExportSupported`) so the action
 * is simply absent where 2D canvas / `toBlob` isn't available — e.g. jsdom — and
 * `exportComparison` fails safe (returns false, never throws).
 */
import type { DrawingData, GameSession, GridDrawing } from '../types/session';
import type { TaskContent } from '../content/tasks';
import { computeGridSpec } from '../engine/grid';
import { drawGridDrawing, drawTargetGhost } from '../engine/render';
import { tokens } from '../styles/tokens';

// Sourced from the design tokens so the exported PNG tracks the (light) theme.
const BG = tokens.color.bg;
const CARD = tokens.color.anchorBg;
const TEXT = tokens.color.text;
const MUTED = tokens.color.textMuted;
const PAD = 16;

/** True only when a real 2D canvas + toBlob + object URLs are available. */
export function isExportSupported(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return (
      typeof c.toBlob === 'function' &&
      c.getContext('2d') != null &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    );
  } catch {
    return false;
  }
}

/** Render a saved drawing (optionally with a ghosted target) into a light card. */
function renderCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  drawing: DrawingData | null,
  ghost: GridDrawing | null,
): void {
  ctx.save();
  ctx.fillStyle = CARD;
  ctx.fillRect(x, y, w, h);
  ctx.translate(x, y);

  if (ghost) {
    drawTargetGhost(
      ctx,
      ghost,
      computeGridSpec(w, h, ghost.grid.cols, ghost.grid.rows, PAD),
    );
  }
  if (drawing) {
    drawGridDrawing(
      ctx,
      drawing,
      computeGridSpec(w, h, drawing.grid.cols, drawing.grid.rows, PAD),
    );
  }
  ctx.restore();
}

/**
 * Build the comparison PNG and trigger a local download. Returns true if the file
 * was produced, false if export is unsupported or rendering failed (never throws).
 */
export async function exportComparison(
  session: GameSession,
  task: TaskContent,
  filename = `literally-${task.id}.png`,
): Promise<boolean> {
  if (!isExportSupported()) return false;
  try {
    const W = 1080;
    const H = 1320;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    ctx.fillStyle = TEXT;
    ctx.font = '600 52px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Two tries at ${task.label}`, W / 2, 96);

    ctx.fillStyle = MUTED;
    ctx.font = '32px system-ui, -apple-system, sans-serif';
    ctx.fillText('What you were asked for', W / 2, 168);

    // The intended target.
    renderCard(ctx, (W - 360) / 2, 196, 360, 360, task.target, null);

    // The two attempts side by side (Mode 1 ghosts the target behind it).
    const cardW = 440;
    const cardY = 640;
    ctx.fillStyle = TEXT;
    ctx.font = '600 34px system-ui, -apple-system, sans-serif';
    ctx.fillText('Without steps', 80 + cardW / 2, cardY - 20);
    ctx.fillText('With steps', W - 80 - cardW / 2, cardY - 20);

    renderCard(
      ctx,
      80,
      cardY,
      cardW,
      cardW,
      session.mode_1_drawing_data,
      task.target,
    );
    renderCard(
      ctx,
      W - 80 - cardW,
      cardY,
      cardW,
      cardW,
      session.mode_2_drawing_data,
      null,
    );

    ctx.fillStyle = MUTED;
    ctx.font = '34px system-ui, -apple-system, sans-serif';
    const s1 = session.mode_1_stress_level ?? '–';
    const s2 = session.mode_2_stress_level ?? '–';
    const c1 = session.mode_1_confidence_level ?? '–';
    const c2 = session.mode_2_confidence_level ?? '–';
    ctx.fillText(
      `Stress ${s1} → ${s2}    ·    Sure? ${c1} → ${c2}`,
      W / 2,
      cardY + cardW + 70,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    );
    if (!blob) return false;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
