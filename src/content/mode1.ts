/**
 * Mode 1 — "Sensory Storm" copy as **data, not JSX** (ADR-007, PRD-005 §5). The
 * screen wires these slots; the words themselves are authored here so they stay
 * reviewable for ethics/sensitivity and translatable without touching components.
 *
 * SCOPE: PRD-005 authors the working copy; PRD-009 owns the *reviewed* decks and
 * may split this module into the named files it references (`mode1.instructions.ts`,
 * `giver.copy.ts`, `notifications.ts`) + the full content test. Until then this is
 * the seam for everything Mode 1 says.
 *
 * GUARDRAILS:
 * - Show, don't tell (ADR-008): nothing here names or explains autism/ASD — the
 *   reveal is Reflection-only (PRD-008/009).
 * - Tone (ethics, _docs/07 §2): the giver is *warm but assuming*; the failure is
 *   the **instructions'**, never the player's. The "not quite right" beat is
 *   gently puzzled, never blaming.
 *
 * The Grown-up's lines (the vague ask + the "not quite right" beat) now live in
 * `content/giver.copy.ts`, and the fake-notification copy in
 * `content/notifications.ts` (PRD-009). The per-subject vague *instruction* block
 * moves to `content/mode1.instructions.ts` next; this module holds only Mode 1's
 * chrome until then.
 */

export const mode1Content = {
  /**
   * The single large block of vague instruction that fades from memory (R05-3).
   * Every clause is under-specified on purpose: "standard", "a bit", "somewhere
   * sensible", "not too big or too small" give nothing to anchor to.
   */
  instruction:
    'Draw a normal house. Make the walls a standard size. Add a roof that sticks out a bit. Put a door somewhere sensible, and maybe a window or two. Don’t make it too big or too small.',

  /** Accessible name for the drawing surface (a11y, PRD-005 §8). */
  canvasLabel: 'Drawing area — draw with your finger.',

  /** Mode 1 chrome controls (the calm-exit safety rails survive the chaos). */
  reduceIntensity: 'Reduce intensity',
  intensityReduced: 'Intensity reduced',
} as const;

export type Mode1Content = typeof mode1Content;
