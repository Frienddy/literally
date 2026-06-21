/**
 * Welcome copy — the minimal, no-spoiler setup (PRD-009 R09-2, ADR-008/ADR-009,
 * doc 07 §1). Content is **data, not JSX** (ADR-007).
 *
 * THE STRUCTURAL BOUNDARY: this file must **never** name or explain autism/ASD.
 * The point is *felt* in the two modes and *named* only on Reflection
 * (`content/reveal.ts`). A content test (`content.boundary`) fails if any
 * autism/ASD term appears here.
 *
 * Deferring the *topic* is deliberate pedagogy — but the **sensory risk is never
 * deferred** (doc 07 §1, ethics consent): we disclose up front that the first part
 * is intentionally busy and that the player can dial it down or stop at any time,
 * and we honestly promise an explanation at the end. That is not deception — we
 * never claim the game is something it isn't.
 */
export const welcome = {
  /** One-line hook — no lecture, no spoiler. */
  hook: 'A tiny drawing game.',
  subhook: 'Takes about 3 minutes.',

  /**
   * Sensory-safety note (consent, R09-2 / doc 07 §1/§3). Discloses the deliberate
   * Mode 1 intensity and the always-available opt-out/exit — plainly, with no
   * spoiler. Pairs with the "Reduce intensity" control below it.
   */
  sensoryNote:
    'Heads-up: the first part is meant to feel a little busy and fiddly. You can turn that down whenever you like — or stop any time.',

  /** Honest "we'll explain after" line — names nothing, promises a debrief. */
  afterNote: 'We’ll explain what it’s about at the very end.',

  /** The sensory-safety opt-out control + the history entry point. */
  reduceIntensity: 'Reduce intensity',
  viewHistory: 'View past sessions',
} as const;

export type WelcomeCopy = typeof welcome;
