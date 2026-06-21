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
  welcome: {
    // ONE-LINE hook only — no lecture, no spoiler (ADR-008).
    hook: 'A tiny drawing game.',
    subhook: 'Takes about 3 minutes.',
    reduceIntensity: 'Reduce intensity',
    viewHistory: 'View past sessions',
  },
  mode1: {
    // The vague, fading ask is authored for real in PRD-005/009; placeholder here.
    giverAsk: "the grown-up's ask:",
    vague: 'Draw a normal house, make the walls standard, add a roof…',
  },
  mode2: {
    // The per-step instruction text + target coords are authored as data in
    // `content/mode2.steps.ts` (PRD-006). These are the surrounding chrome strings;
    // PRD-009 migrates the giver lines into the reviewed `giver.copy.ts` deck.
    stepLabel: (n: number, total: number) => `Step ${n} of ${total}`,
    // The Grown-up's calm, patient framing (R06-11) — clear, never blaming.
    clearAsk: 'We’ll draw it together — one step at a time.',
    finish: 'Finish',
    // `stepHint` is the PRD-004 stub still read by the placeholder screen; the
    // real per-step text lives in `content/mode2.steps.ts` and supersedes it when
    // the Anchor Point screen lands (same PRD-006 commit removes this line).
    stepHint: 'From the dot, go down 4 squares.',
    complete: 'Perfect — exactly right!',
  },
  feedback: {
    stressQuestion: 'How did that feel?',
    confidenceQuestion: 'How sure are you that you did it right?',
  },
  reflection: {
    title: 'Two tries, one little house',
    withoutSteps: 'Without steps',
    withSteps: 'With steps',
    // The reveal copy (the one place autism is named) is owned by PRD-009.
    revealPlaceholder:
      'Same simple task — easy with clear steps, hard without them.',
    playAgain: 'Play again',
    history: 'History',
  },
  history: {
    title: 'Past sessions',
    empty: 'No past sessions yet.',
    deleteAll: 'Delete all my data',
  },
  install: {
    cta: 'Add to Home Screen',
    iosGuidance: 'To install: tap the Share icon, then “Add to Home Screen”.',
  },
} as const;

export type Strings = typeof strings;
