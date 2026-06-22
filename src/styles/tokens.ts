/**
 * Design tokens — the single source of truth for the visual language (PRD-004
 * R04-1, lifted from _docs/06 §4). These are mirrored into `tailwind.config.ts`
 * so every screen styles itself through Tailwind utilities (`bg-bg`, `text-text`,
 * `rounded-card`, …) with **no magic hex in components**.
 *
 * A single **light** theme (ADR-016): a soft light page, white cards, near-black
 * ink. The earlier dark shell + "two visual worlds" per-mode treatment is gone —
 * both modes already share one bright canvas (ADR-015), so the app is uniformly
 * light. Neutrals + accents are tuned to clear WCAG AA on the light surfaces the
 * axe gate scans (Welcome, both modes, Stress, Reflection).
 */
export const tokens = {
  color: {
    // Shared shell — light
    bg: '#eef2f7', // soft light page
    surface: '#ffffff', // white cards / chips / buttons
    text: '#0f172a', // near-black ink (matches the drawing `ink`)
    textMuted: '#475569', // slate-600 — ≥4.5:1 on bg/surface
    // Destructive-action text (History "delete everything"). red-700: ≥4.5:1 on
    // the light surfaces it sits on.
    danger: '#b91c1c',
    // Drawing canvas + Mode 2 accents (already designed for the light canvas).
    gridNode: '#1f6feb',
    ink: '#0f172a', // drawing stroke on the light canvas
    anchorBg: '#f8fafc', // bright, clear canvas
    success: '#166534', // green-800 — ≥4.5:1 for the small "Saved" text on light
    // Primary CTA fill. Carries white button text, so it must clear WCAG AA for
    // normal text (≥4.5:1): #2563eb on #ffffff is 5.17:1. Also ≥3:1 against the
    // white surface for the RatingScale selection ring.
    primary: '#2563eb',
    // Frienddy maker-credit link (Welcome footer). violet-700: ≥4.5:1 on the
    // light bg/surface it sits on, so it stays AA-legible as small text.
    brand: '#6d28d9',
  },
  radius: { card: '16px', button: '14px' },
  space: { touch: '44px' }, // min touch target
  // Responsive layout (ADR-014). The single breakpoint that switches a screen
  // from the portrait "tall" stack to the laptop/desktop "wide" side-by-side
  // layout. Keyed off landscape + a min width so a phone in portrait never goes
  // wide; phones in landscape are handled separately by the phone-only
  // PortraitGuard gate (`useIsPhone`), so this query is purely about layout.
  // Mirrored into `tailwind.config.ts` as the `wide:` variant.
  layout: { wideQuery: '(min-width: 768px) and (orientation: landscape)' },
  font: {
    body: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    sizeBody: '17px',
    sizeStep: '22px', // Mode 2 instruction — big & clear
    lineRelaxed: '1.6',
  },
  motion: {
    giverBeatMs: 2000, // "not quite right" / "Perfect!" beat duration
    snapPopMs: 140, // node snap micro-pop
  },
  // Mode 2 on-grid guidance (_docs/06 §3.4): the pulsing start-node anchor that
  // marks where each step's line begins (the ghost-the-whole-move hint was
  // dropped — only the start point is highlighted now).
  guidance: {
    startNode: '#1f9d57', // pulsing start-node anchor
    targetNode: '#1f6feb', // grid nodes
  },
} as const;

export type Tokens = typeof tokens;
