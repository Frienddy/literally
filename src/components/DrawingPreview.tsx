/**
 * DrawingPreview — a read-only canvas that re-renders a saved drawing (PRD-008
 * R08-2, _docs/04 §2.5). It calls the SAME pure `engine/render.ts` routines as the
 * live `useCanvas` loop, so a saved drawing looks exactly as it was drawn.
 *
 * Two coordinate systems, one component:
 *  - **grid** drawings are resolution-independent `(col,row)` segments → we derive
 *    a centered {@link GridSpec} for the preview box and stroke them.
 *  - **freehand** drawings are pixels in their capture canvas → we scale that
 *    capture space uniformly (no distortion) into the preview, centered.
 *
 * An optional `ghostTarget` is drawn faintly *behind* the drawing — that's the
 * Mode 1 "target reveal" (R08-3), so the gap between the wobbly attempt and the
 * intended result is visible. Rendered on a light surface so the dark engine ink
 * reads with AA contrast (the storm canvas is near-black; see _debt/006).
 *
 * a11y: the canvas carries `role="img"` + a text `label` summary, so the drawing
 * is described even where 2D canvas is unavailable (e.g. jsdom / no-canvas).
 */
import { useLayoutEffect, useRef, useState } from 'react';
import type { DrawingData, GridDrawing } from '../types/session';
import { computeGridSpec } from '../engine/grid';
import {
  clear,
  drawFreehand,
  drawGridDrawing,
  drawTargetGhost,
} from '../engine/render';

export interface DrawingPreviewProps {
  drawing: DrawingData | null;
  /** A clean target to faintly ghost *behind* the drawing (Mode 1 reveal, R08-3). */
  ghostTarget?: GridDrawing | null;
  /** Accessible description of the rendered drawing (R08-2 a11y). */
  label: string;
  className?: string;
  'data-testid'?: string;
}

/** px of breathing room around the drawing inside the preview box. */
const PAD = 10;

export function DrawingPreview({
  drawing,
  ghostTarget = null,
  label,
  className = '',
  'data-testid': testId = 'drawing-preview',
}: DrawingPreviewProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // Measure the box → a pixel size the renderer targets (kept in sync on resize).
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // no 2D context (jsdom): the aria-label still conveys it

    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 1 unit = 1 CSS px
    clear(ctx, size.w, size.h);

    if (ghostTarget) {
      drawTargetGhost(
        ctx,
        ghostTarget,
        computeGridSpec(
          size.w,
          size.h,
          ghostTarget.grid.cols,
          ghostTarget.grid.rows,
          PAD,
        ),
      );
    }

    if (!drawing) return;
    if (drawing.kind === 'grid') {
      drawGridDrawing(
        ctx,
        drawing,
        computeGridSpec(
          size.w,
          size.h,
          drawing.grid.cols,
          drawing.grid.rows,
          PAD,
        ),
      );
      return;
    }

    // freehand: scale capture-space pixels uniformly into the box, centered.
    const cap = drawing.canvas;
    if (cap.width > 0 && cap.height > 0) {
      const scale = Math.min(
        (size.w - PAD * 2) / cap.width,
        (size.h - PAD * 2) / cap.height,
      );
      ctx.save();
      ctx.translate(
        (size.w - cap.width * scale) / 2,
        (size.h - cap.height * scale) / 2,
      );
      ctx.scale(scale, scale);
      drawFreehand(ctx, drawing);
      ctx.restore();
    } else {
      drawFreehand(ctx, drawing); // 0-size capture: best effort, no scaling
    }
  }, [drawing, ghostTarget, size]);

  return (
    <div
      ref={wrapRef}
      data-testid={testId}
      className={`relative overflow-hidden rounded-card bg-anchorBg ${className}`}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
