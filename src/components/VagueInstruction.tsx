/**
 * The vague, fading instruction (PRD-005 R05-3/R05-6/R05-12, GDD §3.2, _docs/06
 * §3.2). A single large block of under-specified text that is fully legible for a
 * moment, then decays toward `minOpacity` so the player must act from a fuzzy
 * recollection — simulating working-memory load. There is deliberately **no way
 * to summon it back** (no "show again" control); the loss is the point.
 *
 * Why an imperative rAF fade (not a CSS transition): the global reduced-motion
 * rule (index.css) forces `transition-duration` to ~0, which would make a CSS fade
 * snap to invisible instantly. R05-12 wants the text to *still fade gently* under
 * reduced-motion (only the drift is suppressed). Driving `opacity` directly per
 * frame is immune to that rule, costs zero React re-renders during the fade
 * (refs-not-state, ADR-006), and so never disturbs the canvas's 60fps (NFR-1).
 *
 * Reduced-intensity (R05-11) keeps it *uncomfortable, not unreadable*: a raised
 * opacity floor, a gentler/slower fade, and a higher-contrast text color.
 */
import { useEffect, useRef } from 'react';
import { config } from '../config';
import { fadeOpacity, type FadeConfig } from '../lib/fade';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export interface VagueInstructionProps {
  /** The grown-up's short, assuming lead-in line. */
  ask: string;
  /** The large under-specified instruction block that fades. */
  instruction: string;
  /** Sensory-safety softening (R05-11): readable floor, gentler fade, raised contrast. */
  reduced?: boolean;
  className?: string;
}

export function VagueInstruction({
  ask,
  instruction,
  reduced = false,
  className = '',
}: VagueInstructionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const cfg: FadeConfig = {
      startDelayMs: config.fade.startDelayMs,
      durationMs: reduced
        ? config.fade.reducedDurationMs
        : config.fade.durationMs,
      minOpacity: reduced
        ? config.fade.reducedMinOpacity
        : config.fade.minOpacity,
    };

    let raf = 0;
    const start =
      typeof performance !== 'undefined' ? performance.now() : Date.now();

    const tick = () => {
      const nowMs =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = nowMs - start;
      const opacity = fadeOpacity(elapsed, cfg);
      node.style.opacity = String(opacity);
      // Drift is motion — suppressed under prefers-reduced-motion (R05-12).
      if (!prefersReducedMotion) {
        const t = Math.max(
          0,
          Math.min(1, (elapsed - cfg.startDelayMs) / cfg.durationMs),
        );
        node.style.transform = `translateY(${-config.fade.driftPx * t}px)`;
      }
      if (opacity > cfg.minOpacity + 0.001) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, prefersReducedMotion]);

  return (
    <div
      ref={ref}
      data-testid="vague-instruction"
      // No aria-hidden: screen-reader users get the full instruction (the
      // memory-decay mechanic is a *visual* sensory load, not an a11y barrier).
      className={[
        reduced ? 'text-text' : 'text-stormText', // raised contrast when reduced
        className,
      ].join(' ')}
      style={{ opacity: 1, willChange: 'opacity, transform' }}
    >
      <p className="text-sm">{ask}</p>
      <p className="mt-1 text-lg leading-relaxed">{instruction}</p>
    </div>
  );
}
