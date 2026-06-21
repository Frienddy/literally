import { describe, it, expect } from 'vitest';
import { reveal } from '../../src/content/reveal';
import { strings } from '../../src/content/strings';

/**
 * The reveal boundary (ADR-008, PRD-008 §8). Autism is felt first in the modes and
 * named for the first time on Reflection — and *only* in `content/reveal.ts`. This
 * test pins both halves: the reveal genuinely names it (with the required
 * disclaimers), and the neutral `strings` deck never does.
 */
const AUTISM = /\b(autis\w*|asd|neurodiver\w*)\b/i;
const FORBIDDEN =
  /\b(autis\w*|asd|neurodiver\w*|disab\w*|sensory processing)\b/i;

/** Flatten every string a copy deck can produce, evaluating builder functions. */
function allStrings(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (typeof node === 'function') {
    // All builders here are pure templating; sample args cover every arity.
    return allStrings((node as (...a: unknown[]) => unknown)('x', 1, 2));
  }
  if (node && typeof node === 'object') {
    return Object.values(node).flatMap(allStrings);
  }
  return [];
}

describe('the reveal names autism — and only here (ADR-008)', () => {
  it('the reveal debrief names autism', () => {
    const text = [...reveal.debrief, ...reveal.disclaimers].join(' ');
    expect(text).toMatch(AUTISM);
  });

  it('carries the three required disclaimers (R08-7): one slice · not a test · people vary', () => {
    expect(reveal.disclaimers).toHaveLength(3);
    const joined = reveal.disclaimers.join(' ').toLowerCase();
    expect(joined).toMatch(/one (small )?slice/);
    expect(joined).toMatch(/not a (diagnosis|test)/);
    expect(joined).toMatch(/every autistic person is different|no single/);
  });

  it('frames the gap as the instructions’, never the player’s fault (R08-4)', () => {
    expect(reveal.framing.toLowerCase()).toContain('you were asked for');
    expect(reveal.framing.toLowerCase()).not.toMatch(/you failed|your fault/);
  });

  it('frames structure as accessibility, not hand-holding (ethics §6)', () => {
    const debrief = reveal.debrief.join(' ').toLowerCase();
    expect(debrief).toContain('accessibility');
  });

  it('the neutral strings deck names no autism/ASD term anywhere', () => {
    for (const value of allStrings(strings)) {
      expect(value).not.toMatch(FORBIDDEN);
    }
  });
});
