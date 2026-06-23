/**
 * Mode 1 — the vague instruction blocks, one per task subject (FR-5). Content is
 * **data, not JSX** (ADR-007). Mode 1 paints on the same pixel canvas as Mode 2
 * (ADR-015); the *only* difference is this single vague ask versus Mode 2's literal
 * one-square-at-a-time steps (`content/mode2.steps.ts`).
 *
 * DESIGN RULE — genuinely under-specified: every clause is deliberately unanchored.
 * No counts, no coordinates, no reference image, nothing that tells you which squares
 * to fill — "normal", "the usual sort", "a sensible size". The subjects are ones
 * everyone can picture instantly (R2-D2, a space alien, Mario, a
 * space fighter, the Mona Lisa) yet has no idea how to *begin* drawing — so the vague
 * ask leaves you stranded on procedure, which is the point: same canvas, same tools,
 * no usable instruction.
 *
 * Tied to the task pool by `content/tasks.ts`. The vague *ask* itself ("just draw it
 * the usual way…") is subject-agnostic and lives in `content/giver.copy.ts`; only the
 * block below names the subject.
 */
export interface VagueInstruction {
  /** The under-specified ask shown (persistently, re-readable) in Mode 1. */
  block: string;
}

export const droidVague: VagueInstruction = {
  block:
    'Draw R2-D2, the little droid from Star Wars. You know the one — the domed silver head with the blue eye, the barrel body, popped up on its legs. Make it look properly like him. Keep it a sensible size, nothing fancy.',
};

export const alienVague: VagueInstruction = {
  block:
    'Draw a space alien. You know the sort — a body, a couple of antennae, some eyes, a few legs. Make it look properly alien. Not too big, not too small.',
};

export const marioVague: VagueInstruction = {
  block:
    'Draw Mario, just standing there. You know the one — the red cap, the moustache, the dungarees, stood facing one way. Make it look properly like him. Keep it a sensible size, nothing fancy.',
};

export const fighterVague: VagueInstruction = {
  block:
    'Draw a space fighter. The usual shape — a cockpit in the middle and a wing out to each side. Make it look like it could fly. Don’t make it too big or too small.',
};

export const monalisaVague: VagueInstruction = {
  block:
    'Draw the Mona Lisa. You know the painting — the lady with the long hair and the little smile, her hands folded in her lap. Make it look like the proper portrait. Keep it a sensible size, nothing fancy.',
};

export const ufoVague: VagueInstruction = {
  block:
    'Draw a UFO beaming up a cow. You know the scene — the flying saucer up top, a beam of light coming down, and a little cow caught floating in it. Make it look like a proper abduction. Keep it a sensible size, nothing fancy.',
};

export const axolotlVague: VagueInstruction = {
  block:
    'Draw an axolotl. You know the little creature — the smiley pink salamander with the feathery frills round its head and its tiny legs. Make it look properly axolotl-ish. Not too big, not too small.',
};
