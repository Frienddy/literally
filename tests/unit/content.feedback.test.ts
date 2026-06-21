import { describe, it, expect } from 'vitest';
import {
  stressScale,
  confidenceScale,
  type RatingScaleContent,
} from '../../src/content/feedback';

/**
 * The feedback scales are authored as data (PRD-007 R07-5/R07-8/R07-3). These
 * guards keep the invariants that the screen, the store clamp, and a11y depend on:
 * values stay in [1,10] and increase, every face is labelled for screen readers,
 * and the confidence wording never turns judgmental.
 */
const scales: Array<[string, RatingScaleContent]> = [
  ['stress', stressScale],
  ['confidence', confidenceScale],
];

describe.each(scales)('%s scale shape', (_name, scale) => {
  it('has at least two faces with strictly increasing integer values in [1,10]', () => {
    expect(scale.faces.length).toBeGreaterThanOrEqual(2);
    let prev = 0;
    for (const face of scale.faces) {
      expect(Number.isInteger(face.value)).toBe(true);
      expect(face.value).toBeGreaterThanOrEqual(1);
      expect(face.value).toBeLessThanOrEqual(10);
      expect(face.value).toBeGreaterThan(prev); // strictly increasing low → high
      prev = face.value;
    }
  });

  it('every face carries a non-empty screen-reader label and a glyph (R07-8)', () => {
    for (const face of scale.faces) {
      expect(face.label.trim().length).toBeGreaterThan(0);
      expect(face.emoji.length).toBeGreaterThan(0);
    }
  });

  it('exposes both endpoint anchors (R07-8, not color-only)', () => {
    expect(scale.lowAnchor.trim().length).toBeGreaterThan(0);
    expect(scale.highAnchor.trim().length).toBeGreaterThan(0);
  });
});

describe('confidence wording stays neutral (R07-3, ethics)', () => {
  // Never frame the answer as failure — only "how sure were you?".
  const JUDGMENTAL = /\b(fail\w*|wrong|bad|stupid|mistake\w*|incorrect)\b/i;

  it('no confidence label or anchor implies failure', () => {
    const text = [
      confidenceScale.lowAnchor,
      confidenceScale.highAnchor,
      ...confidenceScale.faces.map((f) => f.label),
    ].join(' ');
    expect(text).not.toMatch(JUDGMENTAL);
  });
});
