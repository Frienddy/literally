/**
 * Mode 1 — the vague instruction blocks, one per task subject (FR-5). Content is
 * **data, not JSX** (ADR-007). Mode 1 draws on the same snap-to-grid canvas as Mode 2
 * (ADR-015); the *only* difference is this single vague ask versus Mode 2's literal
 * directional steps (`content/mode2.steps.ts`).
 *
 * DESIGN RULE — genuinely under-specified: every clause is deliberately unanchored.
 * No counts, no coordinates, no reference image, nothing that tells you which dots to
 * connect — "normal", "the usual sort", "a sensible size". The subjects are ones
 * everyone can picture instantly (a robot droid, a space alien, a jumping Mario, a
 * space fighter, the Mona Lisa) yet has no idea how to *begin* drawing — so the vague
 * ask leaves you stranded on procedure, which is the point: same dots, same tools, no
 * usable instruction.
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
    'Draw a little robot droid. The usual kind — a domed head, a body, a little eye. Pop it on its legs. Keep it a sensible size, nothing fancy.',
};

export const alienVague: VagueInstruction = {
  block:
    'Draw a space alien. You know the sort — a body, a couple of antennae, some eyes, a few legs. Make it look properly alien. Not too big, not too small.',
};

export const marioVague: VagueInstruction = {
  block:
    'Draw Mario, mid-jump. You know the one — the cap, the moustache, arms up, legs kicking out as he leaps. Make it look like a proper jump. Keep it a sensible size, nothing fancy.',
};

export const fighterVague: VagueInstruction = {
  block:
    'Draw a space fighter. The usual shape — a cockpit in the middle and a wing out to each side. Make it look like it could fly. Don’t make it too big or too small.',
};

export const monalisaVague: VagueInstruction = {
  block:
    'Draw the Mona Lisa. You know the painting — the lady with the long hair and the little smile, her hands folded in her lap. Make it look like the proper portrait. Keep it a sensible size, nothing fancy.',
};
