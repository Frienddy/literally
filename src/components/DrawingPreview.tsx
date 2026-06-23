/**
 * DrawingPreview — a read-only canvas that re-renders a saved drawing (PRD-008
 * R08-2, _docs/04 §2.5). It calls the SAME pure `engine/render.ts` routines as the
 * live `useCanvas` loop, so a saved drawing looks exactly as it was drawn.
 *
 * Both modes paint on the shared pixel canvas (ADR-015), so a saved drawing is a
 * resolution-independent set of colored `(col,row)` cells → we derive a centered
 * {@link GridSpec} for the preview box and fill them.
 *
 * An optional `ghostTarget` is drawn faintly *behind* the drawing — that's the
 * Mode 1 "target reveal" (R08-3), so the gap between the vague-instruction attempt
 * and the intended result is visible. Rendered on a light surface so the colors
 * read with AA contrast.
 *
 * a11y: the canvas carries `role="img"` + a text `label` summary, so the drawing
 * is described even where 2D canvas is unavailable (e.g. jsdom / no-canvas).
 */
import { useLayoutEffect, useRef, useState } from 'react';
import type { DrawingData, PixelDrawing } from '../types/session';
import { computeGridSpec } from '../engine/grid';
import { clear, drawPixelDrawing, drawTargetGhost } from '../engine/render';

export interface DrawingPreviewProps {
  drawing: DrawingData | null;
  /** A clean target to faintly ghost *behind* the drawing (Mode 1 reveal, R08-3). */
  ghostTarget?: PixelDrawing | null;
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
    drawPixelDrawing(
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
