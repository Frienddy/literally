# PRD-009 — Content, Copy & Ethics Gate

| | |
|---|---|
| **Status** | Ready |
| **Source docs** | [01 §8](../_docs/01-game-design.md), [02 §2](../_docs/02-architecture.md), [07 (all)](../_docs/07-accessibility-and-ethics.md), [06 §8](../_docs/06-ui-ux-spec.md) |
| **Roadmap** | Phase 7 |
| **Depends on** | All feature PRDs (they wire the content slots this PRD fills) |
| **Owns FR** | FR-16, FR-20 (content half) · supports FR-5, FR-9, FR-17, FR-19 |

---

## 1. Objective

Author **all player-facing copy and instruction data** as **data, not JSX**, in
`src/content/`, and pass the **ethics release gate**. This includes the show-don't-
tell boundary that is enforced *structurally*: the welcome copy must **not** name
ASD; `reveal.ts` is the only file that does.

## 2. Background & context

Content is externalized so it is reviewable (ethics/sensitivity) and i18n-ready
without touching components ([ADR-007](../_docs/10-glossary-and-decisions.md)). The
pedagogy ("felt first, named after") is guarded by **where the words live**:
`welcome.copy.ts` (minimal, no-spoiler) vs `reveal.ts` (the reveal). The game
depicts autistic experience to build empathy, so the *responsibility* of the copy
is as important as the mechanics ([07](../_docs/07-accessibility-and-ethics.md)).

## 3. Goals / Non-goals

**Goals:** author every content file; enforce the welcome/reveal boundary; tone +
ethics compliance; sensitivity review; task pool data.

**Non-goals:** the components that render copy (PRD-004–008), the a11y mechanics
(PRD-010 — though copy must support them).

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance criterion |
|----|-------------|:--:|----------------------|
| R09-1 | `content/strings.ts`: every player-facing string (buttons, labels, framing, feedback questions). | P0 (ADR-007) | No player-facing string is hard-coded in a component. |
| R09-2 | `content/welcome.copy.ts`: **minimal, no-spoiler** setup — sensory note + "we'll explain after" one-liner — that does **not** name ASD or state the point. | P0 (ADR-008) | A content test asserts welcome strings contain **no** autism/ASD terms; a no-prior-knowledge reader can't tell it's "about autism." |
| R09-3 | `content/reveal.ts`: the Reflection reveal — the **only** place ASD is named — with the required disclaimers (one slice, not a diagnosis/test, people vary). | P0 (ADR-008, FR-9) | Reveal names ASD respectfully; all three disclaimers present; debrief avoids burden/pity/universality. |
| R09-4 | `content/giver.copy.ts`: the Grown-up's lines — **vague** (M1) and **clear** (M2) asks + the "not quite right" and "Perfect!" beats. Warm in both modes; never blames the player. | P0 (FR-16, FR-19) | Both asks + both beats authored; reviewed warm/non-blaming. |
| R09-5 | `content/mode1.instructions.ts`: the vague instruction block(s) — deliberately ambiguous, fading-friendly. | P0 (FR-5) | Vague block is genuinely under-specified (no reference, no grid implied). |
| R09-6 | `content/mode2.steps.ts`: the ordered, literal, unambiguous, verifiable step cards (+ coords) for the canonical subject. | P0 (FR-17) | Steps reproduce the target exactly (validated with PRD-006). |
| R09-7 | `content/tasks.ts`: the **task pool** (house / cat / flower) — each with its vague text + grid target; both modes share one per session. | P1/P2 (FR-20) | House complete (P0 dependency for v1); cat/flower added if in scope. |
| R09-8 | `content/notifications.ts`: the fake-notification copy set — **mundane, never alarming/triggering**. | P1 (FR-7) | Notification set is benign (battery, message, backup); reviewed for triggers. |
| R09-9 | Tone rules applied throughout: honest never mocking; plain short sentences; Mode 1 deliberately vague, Mode 2 deliberately crisp (copy itself teaches); avoid clinical/"suffering"/"normal vs not" framing. | P0 | Copy review confirms tone rules ([01 §8](../_docs/01-game-design.md)). |
| R09-10 | Identity-first, respectful language in the reveal ("autistic person"); avoid "suffers from," casual "disorder," "high/low functioning." | P0 ([07 §2](../_docs/07-accessibility-and-ethics.md)) | Reveal language audited against the do/don't list. |
| R09-11 | `lang` attribute set; copy structured for i18n (EN only v1). | P1 (OQ-8) | Strings are keyed/structured; no concatenation that breaks translation. |
| R09-12 | **Sensitivity review** with autistic reviewers (where possible) of all copy + Mode 1 intensity; feedback applied. | P0 (SC-6) | Review completed; changes logged; sign-off recorded. |

## 5. Technical approach

Folder per [02 §3](../_docs/02-architecture.md): `strings.ts`, `welcome.copy.ts`,
`giver.copy.ts`, `tasks.ts`, `mode1.instructions.ts`, `mode2.steps.ts`,
`reveal.ts`, `notifications.ts`. Each exports typed data consumed by the relevant
component. The **structural boundary** is the key invariant: a unit test scans
`welcome.copy.ts` for forbidden terms (autism, ASD, autistic, spectrum,
neurodiver*) and fails if any appear ([09 §9](../_docs/09-testing-and-qa.md)). Tone
+ ethics rules: [01 §8](../_docs/01-game-design.md), [07](../_docs/07-accessibility-and-ethics.md).

## 6. Non-functional requirements

- **NFR-4 Privacy:** no copy implies cloud backup; honest about local-only data.
- **a11y:** plain language, short sentences; no text baked into images (i18n + a11y).

## 7. Dependencies & interfaces

- **Provides:** all content data consumed by PRD-004–008 slots.
- **Consumes:** the component slot contracts defined in those PRDs; coordinates
  with PRD-006 on `mode2.steps.ts`/`tasks.ts` and PRD-010 on accessible wording.

## 8. Test plan

- **Content unit test:** `welcome.copy.ts` contains **no** autism/ASD terms (the
  reveal is on Reflection only).
- **Content unit test:** ASD terms *do* appear in `reveal.ts` (positive check the
  reveal isn't empty/misplaced).
- **Review:** ethics release-gate checklist ([07 §7](../_docs/07-accessibility-and-ethics.md))
  walked line by line; sensitivity review sign-off.
- **Newcomer comprehension** ties to PRD-011 §playtest (SC-2b).

## 9. Definition of Done

- Every content file authored; no player-facing string hard-coded in components.
- Welcome no-spoiler test passes; reveal names ASD with full disclaimers.
- Giver lines + both beats warm/non-blaming; notifications benign; Mode 2 steps
  reproduce the target.
- **Ethics release-gate checklist fully green**; sensitivity review complete.

## 10. Open questions & risks

- **OQ-9** how explicitly the reveal names autism — clearly, as one slice, never
  universalized; finalized in sensitivity review.
- **OQ-10** final task pool + targets — house first; cat/flower P2.
- **OQ-11** the Grown-up's persona/voice/art — warm teacher/parent; art TBD.
- **Risk:** copy slips into pity/burden/caricature → mitigated by the do/don't
  lists + sensitivity review + the structural welcome/reveal split.

## 11. Traceability

FR-16, FR-20 (content) owned; FR-5, FR-7, FR-9, FR-17, FR-19 (copy support). NFR-4.
ADR-007 (content externalized), ADR-008 (welcome/reveal boundary), ADR-009
(zero-knowledge audience), ADR-011 (giver). SC-2b, SC-6. Roadmap Phase 7 DoD +
[07 §7](../_docs/07-accessibility-and-ethics.md) release gate.
