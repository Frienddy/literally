import { describe, it, expect } from 'vitest';
import { strings } from '../../src/content/strings';
import { welcome } from '../../src/content/welcome.copy';

/**
 * Show, don't tell (ADR-008): the Welcome copy must never name or explain autism
 * before the player has *felt* the contrast. Autism is named only at Reflection
 * ("the reveal"). The comprehensive scan across every content deck lives in
 * `content.boundary.test.ts`; this guards the Welcome no-spoiler rule specifically.
 */
const FORBIDDEN =
  /\b(autis\w*|asd|neurodiver\w*|disab\w*|sensory processing|spectrum)\b/i;

describe('show-don’t-tell content boundary (ADR-008)', () => {
  it('Welcome copy contains no autism/ASD terms (incl. the sensory note)', () => {
    for (const value of Object.values(welcome)) {
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
