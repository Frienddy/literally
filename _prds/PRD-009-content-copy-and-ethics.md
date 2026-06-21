# PRD-009 — Content, Copy & Ethics Gate

| | |
|---|---|
| **Status** | **Done (code/content)** — all decks authored + structural ethics gate green; the human **sensitivity review with autistic reviewers (R09-12)** is a release gate that remains **pending sign-off** (see §9) |
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

- [x] Every content file authored in the canonical `src/content/` layout
  (`strings.ts`, `welcome.copy.ts`, `giver.copy.ts`, `mode1.instructions.ts`,
  `mode2.steps.ts`, `tasks.ts`, `reveal.ts`, `notifications.ts`); no player-facing
  string hard-coded in a component.
- [x] Welcome no-spoiler test passes; reveal names ASD with the full disclaimers
  (`content.boundary.test.ts` scans every neutral deck + the reveal both ways).
- [x] Giver lines + both beats warm/non-blaming; notifications benign; Mode 2 steps
  reproduce the target — all asserted in tests.
- [x] **Task pool closed** (house/cat/flower authored; `_debt/005` resolved).
- [~] **Ethics release-gate checklist** (doc 07 §7): the **code/content-verifiable**
  items are green (walk below); the **human** items (sensitivity review, "verified
  with sensitive users") remain **pending sign-off**.

### Ethics release-gate walk (doc 07 §7)

Code/content-verifiable — **green now**:
- ✅ Welcome is minimal: sensory-safety note + opt-out + honest "we'll explain
  after", and names no ASD (`welcome.copy.ts`; `content.boundary` test).
- ✅ Reveal carries the three disclaimers; identity-first, no pity/"now you know
  what it's like" framing (`content.boundary` test).
- ✅ Sensory risk disclosed up front; no false claim (welcome copy).
- ✅ Giver reads warm in both modes; the "not quite right" beat is gentle,
  brief (~2s), skippable (`GiverBeat`), and blames the instructions; no blaming
  language (`content.boundary` test).
- ✅ Target reveal frames the gap as the instructions' fault (PRD-008 + reveal copy).
- ✅ Confidence wording neutral (PRD-007 `content.feedback` test forbids failure
  language).
- ✅ No notifications alarming/triggering (`content.boundary` test).
- ✅ Calm-exit available throughout Mode 1 (PRD-005 + E2E); 44pt targets; AA on
  non-deliberate text (PRD-004); reduced-motion paths (PRD-005/008).
- ✅ "Delete all my data" works with confirm (PRD-008 + E2E); **no runtime network
  egress** — `grep` confirms no `fetch`/sockets/external URLs in `src/` (ADR-001).
- ✅ `lang="en"` set (`index.html`); copy keyed/structured for i18n (R09-11).

Human gate — **pending sign-off** (cannot be automated):
- ⏳ **Sensitivity review with autistic reviewers (R09-12, SC-6)** of all copy +
  Mode 1 intensity; "not quite right" beat verified with sensitive users; reduced-
  intensity verified to meaningfully soften Mode 1; no-flash/no-startle and
  screen-reader passes on real hardware. Tracked alongside PRD-011 launch gates and
  the existing "pending hardware" items. The authored copy was written to satisfy
  the do/don't + identity-first lists so review starts from a compliant draft.

## 10. Open questions & risks

- **OQ-9** how explicitly the reveal names autism — drafted clearly as one slice,
  never universalized, identity-first; **final wording pending sensitivity review**.
- **OQ-10** final task pool + targets — **resolved: house + cat + flower all
  authored** (`mode2.steps.ts` / `mode1.instructions.ts` / `tasks.ts`).
- **OQ-11** the Grown-up's persona/voice/art — warm teacher/parent voice authored
  in `giver.copy.ts`; **art still TBD** (mascot polish owned by PRD-011).
- **Risk:** copy slips into pity/burden/caricature → mitigated by the do/don't
  lists + sensitivity review + the structural welcome/reveal split.

## 11. Traceability

FR-16, FR-20 (content) owned; FR-5, FR-7, FR-9, FR-17, FR-19 (copy support). NFR-4.
ADR-007 (content externalized), ADR-008 (welcome/reveal boundary), ADR-009
(zero-knowledge audience), ADR-011 (giver). SC-2b, SC-6. Roadmap Phase 7 DoD +
[07 §7](../_docs/07-accessibility-and-ethics.md) release gate.
