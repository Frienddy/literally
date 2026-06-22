/**
 * The Grown-up's lines (PRD-009 R09-4, FR-16/FR-19, ADR-011). Content is **data,
 * not JSX** (ADR-007). One warm character speaks in both modes; only the *clarity*
 * changes — vague in Mode 1, crisp in Mode 2 — so the copywriting itself teaches
 * the lesson (GDD §8).
 *
 * ETHICS GUARDRAILS (doc 07 §2/§6):
 *  - **Warm in both modes, never a villain.** Mode 1 is hard because the *ask* is
 *    unclear, not because the giver is mean or the player is incapable.
 *  - **Blame the instructions, never the person.** The "not quite right" beat is
 *    gently puzzled and ends kindly ("But okay!") — it reads as "I never told you
 *    what I meant", never as scolding the player.
 *  - No autism/ASD here (show-don't-tell, ADR-008): the giver never names the point.
 *
 * The *subject* of the vague ask (droid / alien / monster / fighter) lives with the
 * task in `content/mode1.instructions.ts`; these lines are subject-agnostic so
 * they're reused across the whole task pool.
 */
export const giver = {
  /**
   * Mode 1 — the vague ask. Warm and *assuming* you already know what's meant;
   * deliberately gives nothing concrete to anchor to (the fading block names the
   * actual subject).
   */
  vagueAsk: 'Just draw it the usual way — you know the kind I mean.',

  /**
   * Mode 1 — the gently-puzzled "not quite right" beat on Done (FR-19). Lands as
   * the *ask* having fallen short ("I had something in mind, I just never told
   * you"), and still ends warmly. Never scolds, never blames the player.
   */
  notQuiteRight: 'Hmm… that’s not quite what I had in mind. But okay!',

  /**
   * Mode 2 — the calm, patient framing before the first literal step (FR-16). The
   * same warm voice, now clear: "we'll do this together, one step at a time."
   */
  clearIntro: 'We’ll draw it together — one step at a time.',

  /**
   * Mode 2 — the warm completion beat (FR-19). Celebrates the shared success; the
   * structure made it easy, and that's the point.
   */
  perfect: 'Perfect — exactly right!',
} as const;

export type Giver = typeof giver;
