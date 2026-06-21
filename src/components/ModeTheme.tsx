/**
 * The "two visual worlds" theming seam (PRD-004 R04-9/R04-10, FR-23, ADR-013).
 * Wraps a mode's content and applies its theme treatment — canvas background,
 * vignette, saturation, blur — from the design tokens (_docs/06 §D). Mode 1's
 * "storm" is desaturated/blurred/vignetted (uneasy); Mode 2's "anchor" is bright
 * and crisp (trustworthy). The *aesthetic* contrast mirrors the *cognitive* one.
 *
 * Pass `clearFrom="storm"` on the Mode 2 wrapper to play the ~900ms "fog clearing"
 * reveal on the M1→M2 handoff: the wrapper mounts with the storm treatment and
 * transitions to anchor. The global `prefers-reduced-motion` rule (_docs/07)
 * collapses the CSS transition to instant automatically.
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  tokens,
  type ModeTheme as ModeThemeName,
  type ThemeValues,
} from '../styles/tokens';

const filterFor = (t: ThemeValues) =>
  `saturate(${t.saturate}) blur(${t.blurPx}px)`;

export interface ModeThemeProps {
  mode: ModeThemeName;
  /** Start from this theme and animate to `mode` (the fog-clearing reveal). */
  clearFrom?: ModeThemeName;
  children: ReactNode;
  className?: string;
}

export function ModeTheme({
  mode,
  clearFrom,
  children,
  className = '',
}: ModeThemeProps) {
  const target = tokens.theme[mode];
  const [applied, setApplied] = useState<ThemeValues>(
    clearFrom ? tokens.theme[clearFrom] : target,
  );

  useEffect(() => {
    if (!clearFrom) {
      setApplied(target);
      return;
    }
    // Flip to the target next frame so the CSS transition actually animates.
    const id = requestAnimationFrame(() => setApplied(target));
    return () => cancelAnimationFrame(id);
  }, [mode, clearFrom, target]);

  // Only saturate/blur/vignette apply to the whole mode (the shell stays dark so
  // chrome — dots, mascot, step card — reads in both worlds). The per-theme
  // `canvas` color belongs to the *drawing area* itself (Mode 1 dark, Mode 2
  // bright), set by each screen.
  return (
    <div
      data-mode-theme={mode}
      className={`relative h-full w-full transition-[filter] duration-theme ${className}`}
      style={{ filter: filterFor(applied) }}
    >
      {children}
      {applied.vignette > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: `inset 0 0 140px rgba(0,0,0,${applied.vignette})`,
          }}
        />
      )}
    </div>
  );
}
