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
 * The fake-notification copy now lives in `content/notifications.ts` (PRD-009).
 */

export const mode1Content = {
  /** The grown-up's vague ask — warm, assuming you already know what they mean. */
  giverAsk: 'Just draw it the usual way — you know the kind I mean.',

  /**
   * The single large block of vague instruction that fades from memory (R05-3).
   * Every clause is under-specified on purpose: "standard", "a bit", "somewhere
   * sensible", "not too big or too small" give nothing to anchor to.
   */
  instruction:
    'Draw a normal house. Make the walls a standard size. Add a roof that sticks out a bit. Put a door somewhere sensible, and maybe a window or two. Don’t make it too big or too small.',

  /**
   * The mildly-puzzled "not quite right" beat shown on Done (R05-8). Reads as the
   * *ask* falling short — "I had something in mind, I just never told you" — and
   * still ends warmly ("But okay!"). Never scolds.
   */
  beat: 'Hmm… that’s not quite what I had in mind. But okay!',

  /** Accessible name for the drawing surface (a11y, PRD-005 §8). */
  canvasLabel: 'Drawing area — draw with your finger.',

  /** Mode 1 chrome controls (the calm-exit safety rails survive the chaos). */
  reduceIntensity: 'Reduce intensity',
  intensityReduced: 'Intensity reduced',
} as const;

export type Mode1Content = typeof mode1Content;
