import { describe, it, expect } from 'vitest';
import { strings } from '../../src/content/strings';
import { welcome } from '../../src/content/welcome.copy';
import { giver } from '../../src/content/giver.copy';
import { notifications } from '../../src/content/notifications';
import { reveal } from '../../src/content/reveal';
import { TASK_CONTENT } from '../../src/content/tasks';

/**
 * The ethics content gate (PRD-009 §8, ADR-008, doc 07). Enforces *structurally*
 * what review enforces by hand:
 *  - the show-don't-tell boundary (autism named **only** in reveal.ts);
 *  - the reveal's required disclaimers + identity-first / non-pity language;
 *  - notifications stay benign; the giver never blames the player.
 */
const FORBIDDEN =
  /\b(autis\w*|asd|neurodiver\w*|disab\w*|sensory processing|spectrum)\b/i;
const AUTISM = /\b(autis\w*|asd|neurodiver\w*)\b/i;

/** Every string a deck can produce, evaluating builder functions with samples. */
function allStrings(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (typeof node === 'function') {
    return allStrings((node as (...a: unknown[]) => unknown)('x', 1, 2));
  }
  if (node && typeof node === 'object') {
    return Object.values(node).flatMap(allStrings);
  }
  return [];
}

describe('show-don’t-tell boundary (ADR-008, R09-2)', () => {
  const NEUTRAL_DECKS = {
    strings,
    welcome,
    giver,
    notifications,
    tasks: TASK_CONTENT, // labels, vague blocks, and every Mode 2 step text
  };

  for (const [name, deck] of Object.entries(NEUTRAL_DECKS)) {
    it(`${name} names no autism/ASD term anywhere`, () => {
      for (const value of allStrings(deck)) {
        expect(value, value).not.toMatch(FORBIDDEN);
      }
    });
  }

  it('reveal.ts IS where autism is named (the positive half of the boundary)', () => {
    expect(allStrings(reveal).join(' ')).toMatch(AUTISM);
  });
});

describe('the reveal — required disclaimers + respectful framing (R09-3/R09-10)', () => {
  const text = allStrings(reveal).join(' ').toLowerCase();

  it('carries the three disclaimers: one slice · not a diagnosis/test · people vary', () => {
    expect(reveal.disclaimers).toHaveLength(3);
    expect(text).toMatch(/one (small )?slice/);
    expect(text).toMatch(/not a (diagnosis|test)/);
    expect(text).toMatch(/every autistic person is different|no single/);
  });

  it('frames the gap as the instructions’, not the player’s fault (R08-4)', () => {
    expect(reveal.framing.toLowerCase()).toContain('you were asked for');
    expect(text).not.toMatch(/you failed|your fault/);
  });

  it('frames structure as accessibility and invites action (doc 07 §6)', () => {
    expect(text).toContain('accessibility');
    expect(reveal.invite.length).toBeGreaterThan(0);
  });

  it('is identity-first with no pathologizing or pity language', () => {
    expect(text).toMatch(/autistic (child|person|people)/);
    for (const bad of [
      'suffers from',
      'suffering from',
      'high-functioning',
      'low-functioning',
      'high functioning',
      'low functioning',
      'what it’s like to be autistic',
      'what it is like to be autistic',
    ]) {
      expect(text, bad).not.toContain(bad);
    }
  });
});

describe('notifications stay benign (R09-8, sensory safety)', () => {
  const ALARMING =
    /\b(emergency|urgent|alert|warning|fire|evacuat\w*|hacked|breach|fraud|virus|danger\w*|sos|911|account locked)\b/i;

  it('no alarming or potentially-triggering copy', () => {
    for (const n of notifications) {
      expect(`${n.title} ${n.body ?? ''}`).not.toMatch(ALARMING);
    }
  });
});

describe('the giver never blames the player (R09-4, doc 07 §2)', () => {
  it('no scolding / blaming language in the Grown-up’s lines', () => {
    const text = allStrings(giver).join(' ').toLowerCase();
    for (const bad of [
      'you failed',
      'your fault',
      'bad job',
      'stupid',
      'you should have',
      'try harder',
    ]) {
      expect(text, bad).not.toContain(bad);
    }
  });
});
