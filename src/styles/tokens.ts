/**
 * Design tokens — the single source of truth for the visual language (PRD-004
 * R04-1, lifted from _docs/06 §4). These are mirrored into `tailwind.config.ts`
 * so every screen styles itself through Tailwind utilities (`bg-bg`, `text-text`,
 * `rounded-card`, …) with **no magic hex in components**.
 *
 * The palette deliberately encodes the game's thesis as two visual worlds: the
 * Mode 1 "storm" colors are desaturated and low-contrast (uneasy); the Mode 2
 * "anchor" colors are bright and high-contrast (trustworthy). See `tokens.theme`
 * for the per-mode wrapper treatment (ADR-013, FR-23).
 */
export const tokens = {
  color: {
    // Shared shell
    bg: '#0b1020', // deep calm navy
    surface: '#141a33',
    text: '#e7ecff',
    textMuted: '#8b93b8',
    // Mode 1 (storm) — desaturated, low-contrast, uneasy
    stormText: '#5b6384', // deliberately hard-to-read vague text
    stormWarn: '#b45a5a',
    // Mode 1 freehand stroke. A *distinct* ink (not tokens.color.ink, which is
    // near-invisible on the storm canvas — DEBT-006): deliberately low-but-nonzero
    // contrast so the line is legible yet effortful (≈3.1:1 on theme.storm.canvas
    // #11162a). Raised under reduced-intensity to ≈5:1 (clearly legible), matching
    // the fade/notification softening (R05-11). Only the live Mode 1 canvas uses
    // these; saved previews re-render on a light surface with the committed `ink`.
    stormInk: '#5d6486',
    stormInkReduced: '#7e87ab',
    // Mode 2 (anchor) — high contrast, trustworthy
    gridNode: '#1f6feb',
    ink: '#0f172a', // drawing stroke on light canvas
    anchorBg: '#f8fafc', // bright, clear canvas
    success: '#1f9d57',
    // Primary CTA fill. Carries white button text, so it must clear WCAG AA for
    // normal text (≥4.5:1): #2563eb on #ffffff is 5.17:1. The previous #3b82f6 was
    // only 3.67:1 — a serious contrast failure axe caught on the Start/Next CTAs
    // (PRD-010 R10-7). Still ≥3:1 against #141a33 for the RatingScale selection ring.
    primary: '#2563eb',
  },
  radius: { card: '16px', button: '14px' },
  space: { touch: '44px' }, // min touch target
  font: {
    body: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    sizeBody: '17px',
    sizeStep: '22px', // Mode 2 instruction — big & clear
    lineRelaxed: '1.6',
  },
  motion: {
    fadeMs: 12000, // Mode 1 instruction decay
    notifyEveryMs: [4000, 8000], // jittered distraction cadence
    notifyVisibleMs: 2200,
    giverBeatMs: 2000, // "not quite right" / "Perfect!" beat duration
    themeTransitionMs: 900, // storm → anchor "fog clearing"
    snapPopMs: 140, // node snap micro-pop
  },
  // Two visual worlds (_docs/06 §D). Apply as a wrapper filter/overlay per mode.
  theme: {
    storm: { canvas: '#11162a', vignette: 0.45, saturate: 0.6, blurPx: 0.4 },
    anchor: { canvas: '#f8fafc', vignette: 0.0, saturate: 1.0, blurPx: 0.0 },
  },
  // Mode 2 on-grid guidance (_docs/06 §3.4).
  guidance: {
    startNode: '#1f9d57', // pulsing start node
    ghostPath: 'rgba(31,111,235,.28)', // faint target hint
    targetNode: '#1f6feb',
  },
} as const;

export type Tokens = typeof tokens;
export type ModeTheme = keyof Tokens['theme'];
export type ThemeValues = Tokens['theme'][ModeTheme];
