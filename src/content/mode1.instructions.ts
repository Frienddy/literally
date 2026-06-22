/**
 * Mode 1 — the vague instruction blocks, one per task subject (PRD-009 R09-5,
 * FR-5). Content is **data, not JSX** (ADR-007). Mode 1 draws on the same
 * snap-to-grid canvas as Mode 2 (ADR-015); the *only* difference is this single
 * vague ask versus Mode 2's literal directional steps (`content/mode2.steps.ts`).
 *
 * DESIGN RULE — genuinely under-specified: every clause is deliberately
 * unanchored. No counts, no coordinates, no reference image, nothing that tells
 * you which dots to connect — "normal", "a bit", "somewhere sensible", "the usual
 * sort", "not too big or too small". You can only act from a fuzzy idea of the
 * subject, which is the point: same dots, same tools, no usable instruction.
 *
 * Tied to the task pool by `content/tasks.ts`. The vague *ask* itself ("just draw
 * it the usual way…") is subject-agnostic and lives in `content/giver.copy.ts`;
 * only the block below names the subject.
 */
export interface VagueInstruction {
  /** The under-specified ask shown (persistently, re-readable) in Mode 1. */
  block: string;
}

export const houseVague: VagueInstruction = {
  block:
    'Draw a normal house. Make the walls a standard size. Add a roof that sticks out a bit. Put a door somewhere sensible, and maybe a window or two. Don’t make it too big or too small.',
};

export const catVague: VagueInstruction = {
  block:
    'Draw a cat. The usual sort — a head, a couple of ears, the right kind of shape. Give it a face if you like. Keep it a sensible size, nothing fancy.',
};

export const flowerVague: VagueInstruction = {
  block:
    'Draw a flower. Give it a stem and some petals, a leaf or two perhaps. Make it a normal sort of flower — not too big, not too small.',
};
