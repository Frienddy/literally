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
 * - Faces are an app-shipped SVG set, not platform emoji (R07-9 / R11-10): each face
 *   carries a `mood` the `Face` component draws, so the glyphs look identical on every
 *   device. The drawn mood follows the label's *sentiment*, not the numeric value —
 *   so stress (low value = calm = positive) and confidence (low value = unsure =
 *   negative) read correctly from the same component.
 */

/** One face on a rating scale. */
export interface RatingFace {
  /**
   * Sentiment the `Face` component draws, −2 (very negative) … +2 (very positive)
   * (R07-9 / R11-10). Independent of `value`: it mirrors how the label *feels*.
   */
  mood: -2 | -1 | 0 | 1 | 2;
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
    { mood: 2, label: 'Calm', value: VALUES[0] },
    { mood: 1, label: 'A little tense', value: VALUES[1] },
    { mood: 0, label: 'Tense', value: VALUES[2] },
    { mood: -1, label: 'Stressed', value: VALUES[3] },
    { mood: -2, label: 'Overwhelmed', value: VALUES[4] },
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
    { mood: -2, label: 'Not sure at all', value: VALUES[0] },
    { mood: -1, label: 'A little unsure', value: VALUES[1] },
    { mood: 0, label: 'Fairly sure', value: VALUES[2] },
    { mood: 1, label: 'Sure', value: VALUES[3] },
    { mood: 2, label: 'Very sure', value: VALUES[4] },
  ],
};
