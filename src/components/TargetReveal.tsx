/**
 * TargetReveal — the intended result, shown for the first time on Reflection
 * (PRD-008 R08-3, _docs/06 §3.5). This is the hidden target the player was never
 * shown during play (ADR-010); revealing it reframes the Mode 1 gap as the
 * *instructions'* doing, not the player's.
 *
 * It fades in gently — unless `prefers-reduced-motion` is set, in which case it
 * appears instantly (R08-13 / NFR-6). The clean target is a grid drawing, so it
 * re-renders through the shared `DrawingPreview` like every other saved drawing.
 */
import { useEffect, useState } from 'react';
import type { GridDrawing } from '../types/session';
import { DrawingPreview } from './DrawingPreview';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export interface TargetRevealProps {
  /** The clean, intended drawing for this session's task (the hidden target). */
  target: GridDrawing;
  /** Caption above the target (e.g. "What you were asked for — both times"). */
  heading: string;
  /** Accessible summary of the target image. */
  label: string;
  className?: string;
}

export function TargetReveal({
  target,
  heading,
  label,
  className = '',
}: TargetRevealProps) {
  const reduced = usePrefersReducedMotion();
  // Reduced motion → start fully shown; otherwise fade 0 → 1 on the next frame.
  const [shown, setShown] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  return (
    <figure className={`flex flex-col items-center gap-2 ${className}`}>
      <figcaption className="text-center text-sm text-textMuted">
        {heading}
      </figcaption>
      <div
        data-testid="target-reveal"
        className="transition-opacity duration-700 ease-out"
        style={{ opacity: shown ? 1 : 0 }}
      >
        <DrawingPreview
          drawing={target}
          label={label}
          data-testid="target-preview"
          className="h-32 w-32"
        />
      </div>
    </figure>
  );
}
