/**
 * Player-facing copy as **data, not JSX** (ADR-007, _docs/06 §8) so it stays
 * reviewable for ethics/sensitivity and translatable without touching components.
 *
 * SCOPE: these are PRD-004 **stub** strings — enough to make the flow walkable.
 * The reviewed copy decks (`welcome.copy.ts`, `giver.copy.ts`, `mode2.steps.ts`,
 * `reveal.ts`, `notifications.ts`, …) and the ethics content tests are owned by
 * PRD-009. Until then this single module is the seam.
 *
 * GUARDRAIL — show, don't tell (ADR-008): the `welcome` copy must **not** name or
 * explain autism/ASD. Autism is named only on Reflection ("the reveal"), and that
 * final wording lands with PRD-009. A content test enforces this boundary in
 * PRD-009 (_docs/09 §9).
 */
export const strings = {
  app: {
    name: 'Literally',
  },
  common: {
    start: 'Start',
    continue: 'Continue',
    done: 'Done',
    next: 'Next step',
    undo: 'Undo',
    exit: 'Exit',
    back: 'Back',
  },
  // Welcome's no-spoiler copy (hook, sensory note, "explained at the end") lives in
  // `content/welcome.copy.ts` (PRD-009) — the structural show-don't-tell boundary.
  mode1: {
    // Mode 1 chrome. The vague ask + "not quite right" beat are in `giver.copy.ts`;
    // the per-subject vague instruction block is in `mode1.instructions.ts`. Mode 1
    // shares Mode 2's snap-to-grid canvas (ADR-015); only the instruction differs.
    canvasLabel: 'Drawing grid — tap or drag to snap a line to the dots.',
    // The single, persistent instruction card label (the deliberate contrast with
    // Mode 2's counted "Step 1 of 9").
    taskLabel: 'Your task',
    doneLabel: 'Done',
  },
  // Mode 1's player-facing copy (the vague ask, the single instruction, the
  // "not quite right" beat) is authored as data in `giver.copy.ts` /
  // `mode1.instructions.ts`; PRD-009 migrates it into the reviewed decks.
  mode2: {
    // The per-step instruction text + target coords are authored as data in
    // `content/mode2.steps.ts` (PRD-006); the Grown-up's calm intro + completion
    // beat live in `content/giver.copy.ts` (PRD-009). These are the chrome strings.
    stepLabel: (n: number, total: number) => `Step ${n} of ${total}`,
    finish: 'Finish',
    // Names the live snap-to-grid canvas for screen readers (a11y, PRD-010 R10-9),
    // mirroring Mode 1's `canvasLabel`.
    canvasLabel: 'Drawing grid — tap or drag to snap a line to the dots.',
  },
  feedback: {
    stressQuestion: 'How did that feel?',
    confidenceQuestion: 'How sure are you that you did it right?',
  },
  reflection: {
    // Subject-aware so the payoff names the task the player actually drew.
    title: (subject: string) => `Two tries at ${subject}`,
    withoutSteps: 'Without steps',
    withSteps: 'With steps',
    // The reveal copy (the one place autism is named) lives in `content/reveal.ts`.
    // These reflection chrome strings stay strictly neutral (content boundary test).
    // Read-aloud summaries of the two saved drawings (a11y, PRD-008 §6).
    summaryWithout: (subject: string) =>
      `Your drawing of ${subject}, made without clear steps.`,
    summaryWith: (subject: string) =>
      `Your drawing of ${subject}, made with clear steps.`,
    targetSummary: (subject: string) => `The intended ${subject}.`,
    // Per-attempt score line (stress + "how sure"), never framed as a grade.
    scoreLine: (stress: number | null, confidence: number | null) =>
      `stress ${stress ?? '–'} · sure? ${confidence ?? '–'}`,
    // Personal deltas (R08-6) — an arrow from Mode 1 to Mode 2, not a verdict.
    delta: (label: string, from: number | null, to: number | null) =>
      `${label} ${from ?? '–'} → ${to ?? '–'}`,
    stressLabel: 'Stress',
    confidenceLabel: 'Sure?',
    saved: '✓ Saved on this device',
    exportImage: 'Save image',
    exportAria: 'Save a picture of both drawings to this device',
    playAgain: 'Play again',
    history: 'View past sessions',
  },
  history: {
    title: 'Past sessions',
    empty: 'No past sessions yet.',
    // Newest-first list item: date + the Mode 1 → Mode 2 stress arc (R08-9).
    arc: (date: string, from: number | null, to: number | null) =>
      `${date} · stress ${from ?? '–'} → ${to ?? '–'}`,
    openAria: (date: string) => `Open the session from ${date}`,
    deleteAll: 'Delete all my data',
    // Destructive wipe needs an explicit confirm step (R08-10, PRD-010).
    confirmPrompt: 'Delete everything on this device?',
    confirmYes: 'Yes, delete it all',
    confirmNo: 'Keep my sessions',
  },
  install: {
    cta: 'Add to Home Screen',
    iosGuidance: 'To install: tap the Share icon, then “Add to Home Screen”.',
  },
  // Storage-full recovery prompt (PRD-002 R02-13 / _debt/002). Calm and
  // non-alarming: the app stays usable; this only offers to free up room.
  quota: {
    title: 'This device is out of room',
    body: 'Your most recent drawing is safe, but there’s no space to keep older sessions. Want to clear the older ones to free up room?',
    clear: 'Clear older sessions',
    dismiss: 'Not now',
  },
} as const;

export type Strings = typeof strings;
