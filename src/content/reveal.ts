/**
 * The reveal — Reflection debrief copy (PRD-008 R08-3…R08-7, _docs/01 §6,
 * _docs/07 §1/§6). Content is **data, not JSX** (ADR-007).
 *
 * THIS IS THE ONE AND ONLY FILE ALLOWED TO NAME AUTISM (ADR-008, "show don't
 * tell"). Autism is felt first in the two modes and named here for the first
 * time — never on Welcome or in either mode. A content test pins this boundary
 * (`tests/unit/content.reveal.test.ts`): the term appears here and nowhere in the
 * neutral `strings` deck.
 *
 * Tone guardrails baked into the copy below (_docs/07 §2/§6):
 *  - **Indict the instructions, not the player** (R08-4) — the gap is the ask's
 *    fault; the player never "failed".
 *  - **Accessibility, not hand-holding** — clear/literal/structured steps are
 *    framed as access that helped *you* too, not as a burden or a kindness.
 *  - **Identity-first, no pathologizing** — "an autistic child", never "suffers
 *    from"/"a disorder".
 *  - **One slice, not a diagnosis, people vary** — the three required disclaimers
 *    (R08-7) are always visible.
 *
 * SCOPE: this is the drafted reveal slot. The *final* wording lands with PRD-009's
 * sensitivity review (the wireframe in _docs/06 §3.5 is the layout target); the
 * structure here is what the screen wires, so review can edit strings without
 * touching components.
 */
export const reveal = {
  /** Caption over the clean target (the intended result, revealed at last). */
  targetHeading: 'What you were asked for — both times',

  /**
   * Framing under the two attempts. Names the gap as the *instructions'* doing,
   * never the player's (R08-4). "this" points at the target shown just above.
   */
  framing:
    'Both times you were asked for this. With clear, step-by-step instructions it was easy. Without them, the very same task was much harder — and you couldn’t even tell whether you’d got it right.',

  /**
   * The reveal, in plain language. The FIRST time the game names autism (R08-5).
   * Connects the felt difficulty to a real, everyday experience, then reframes
   * Mode 2's structure as accessibility (not hand-holding, not a burden).
   */
  debrief: [
    'That feeling — the not-knowing, the second-guessing — is a little like how an ordinary task can feel for an autistic child when instructions aren’t clear, literal, and direct.',
    'The second time wasn’t hand-holding. Clear, literal, structured steps aren’t extra — they’re accessibility. They made the same task doable and calmer, and that helps almost everyone.',
  ],

  /**
   * Required disclaimers (R08-7, R09-3, _docs/07 §1). Always shown with the
   * debrief: one slice · not a diagnosis/test · people vary.
   */
  disclaimers: [
    'This is one small slice of one kind of experience — not “what autism is like”.',
    'It’s a short empathy exercise, not a diagnosis or a test.',
    'Every autistic person is different; no single experience speaks for everyone.',
  ],

  /**
   * Gentle invite to action (doc 07 §6 "Do") — turns the empathy outward without
   * pity or pressure. Closes the debrief.
   */
  invite: 'Where might clearer, more literal steps help someone you know?',

  /** Heading over the personal stress/confidence deltas (reflection, not a score). */
  deltaHeading: 'How it felt for you',
} as const;

export type Reveal = typeof reveal;
