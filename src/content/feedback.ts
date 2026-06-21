/**
 * Feedback-check scales as **data, not JSX** (ADR-007, PRD-007 §5). The
 * `FeedbackCheckScreen` wires two of these — stress + confidence — and the faces,
 * their screen-reader labels, endpoint anchors and stored values are authored here
 * so they stay reviewable for ethics/sensitivity and translatable without touching
 * components.
 *
 * GUARDRAILS:
 * - 1–10 internally (R07-5, ADR-012): the UI shows 5 faces; each maps to an integer
 *   the store clamps to [1,10] (OQ-12 — final face count is a playtest call). Values
 *   are strictly increasing low → high.
 * - Neutral confidence wording (R07-3): "how sure were you?", never "did you fail?"
 *   / "were you wrong?". The confidence gap (low after Mode 1, high after Mode 2) is
 *   the goal's key signal (SC-2c) — the question must not feel judgmental.
 * - Labels carry the meaning for screen readers (R07-8): each face announces a word
 *   ("Calm" … "Very stressed"), not just a position or a color gradient.
 * - The emoji are **placeholders** (R07-9): platform emoji vary by device, so a
 *   consistent app-shipped face set replaces these in PRD-011's polish pass. Keeping
 *   them as data here means that swap touches only this file.
 */

/** One face on a rating scale. */
export interface RatingFace {
  /** Placeholder glyph until the shipped face set lands (R07-9 / PRD-011). */
  emoji: string;
  /** The announced meaning of this face — words, not a number (R07-8, a11y). */
  label: string;
  /** Stored integer in [1,10] (R07-5). Strictly increasing across the scale. */
  value: number;
}

/** A full emoji-anchored scale: the faces plus the two endpoint words. */
export interface RatingScaleContent {
  /** Endpoint words (also shown under the faces) — the scale's low → high anchors. */
  lowAnchor: string;
  highAnchor: string;
  /** Faces ordered low → high. */
  faces: RatingFace[];
}

/** Five faces spread across the 1–10 range; index 0 → 2 … index 4 → 10. */
const VALUES = [2, 4, 6, 8, 10] as const;

/** Stress — "How did that feel?" — friendly faces calm → tense (R07-2). */
export const stressScale: RatingScaleContent = {
  lowAnchor: 'Calm',
  highAnchor: 'Overwhelmed',
  faces: [
    { emoji: '😌', label: 'Calm', value: VALUES[0] },
    { emoji: '🙂', label: 'A little tense', value: VALUES[1] },
    { emoji: '😐', label: 'Tense', value: VALUES[2] },
    { emoji: '😟', label: 'Stressed', value: VALUES[3] },
    { emoji: '😣', label: 'Overwhelmed', value: VALUES[4] },
  ],
};

/**
 * Confidence — "How sure are you that you did it right?" — not-sure → very-sure
 * (R07-3). Wording stays strictly neutral: every label is about *how sure*, never
 * about failing or being wrong.
 */
export const confidenceScale: RatingScaleContent = {
  lowAnchor: 'Not sure',
  highAnchor: 'Very sure',
  faces: [
    { emoji: '🤷', label: 'Not sure at all', value: VALUES[0] },
    { emoji: '😕', label: 'A little unsure', value: VALUES[1] },
    { emoji: '🙂', label: 'Fairly sure', value: VALUES[2] },
    { emoji: '😀', label: 'Sure', value: VALUES[3] },
    { emoji: '💯', label: 'Very sure', value: VALUES[4] },
  ],
};
