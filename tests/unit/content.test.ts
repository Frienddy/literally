import { describe, it, expect } from 'vitest';
import { strings } from '../../src/content/strings';

/**
 * Show, don't tell (ADR-008): the Welcome copy must never name or explain autism
 * before the player has *felt* the contrast. Autism is named only at Reflection
 * ("the reveal"). PRD-009 owns the full content test over the reviewed copy decks;
 * this is the early guard on the stub strings so the boundary can't regress.
 */
const FORBIDDEN =
  /\b(autis\w*|asd|neurodiver\w*|disab\w*|sensory processing)\b/i;

describe('show-don’t-tell content boundary (ADR-008)', () => {
  it('Welcome strings contain no autism/ASD terms', () => {
    for (const value of Object.values(strings.welcome)) {
      expect(String(value)).not.toMatch(FORBIDDEN);
    }
  });

  it('the app name and common controls stay neutral', () => {
    for (const value of Object.values(strings.common)) {
      expect(String(value)).not.toMatch(FORBIDDEN);
    }
    expect(strings.app.name).not.toMatch(FORBIDDEN);
  });
});
