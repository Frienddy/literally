# PRD-007 — Feedback Checks (Stress + Confidence)

| | |
|---|---|
| **Status** | Ready |
| **Source docs** | [01 §5](../_docs/01-game-design.md), [06 §3.3](../_docs/06-ui-ux-spec.md), [03 §2](../_docs/03-data-model-and-state.md) |
| **Roadmap** | Phases 3–5 (scaffold with navigation, complete with the modes) |
| **Depends on** | PRD-002 (store), PRD-004 (shell/router/components) |
| **Owns FR** | FR-8 |

---

## 1. Objective

Deliver the **single, reused feedback screen** shown after each mode, capturing
**two** quick self-ratings — **stress** ("how did that feel?") and **confidence**
("how sure are you that you did it right?") — on a friendly **emoji-anchored
scale**. The **confidence gap** (low after Mode 1, high after Mode 2) is the
cleanest measure of the product goal.

## 2. Background & context

Stress alone doesn't capture "I couldn't tell if I did it right," which is central
to the goal — hence confidence is captured alongside it ([ADR-012](../_docs/10-glossary-and-decisions.md)).
The scale is emoji-anchored (faces) rather than a bare number line: faster, lower
cognitive load ([06 §3.3](../_docs/06-ui-ux-spec.md)). Values are stored as
integers 1–10 internally regardless of how many faces the UI shows.

## 3. Goals / Non-goals

**Goals:** `FeedbackCheckScreen` (reused for #1 and #2), `RatingScale` component
(reused for both questions), wiring to `setStress`/`setConfidence`, single
continue action, screen-reader-labeled faces.

**Non-goals:** the modes that precede it (PRD-005/006), the deltas display
(PRD-008 Reflection), the persisted schema (PRD-002 already defines the fields).

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance criterion |
|----|-------------|:--:|----------------------|
| R07-1 | `FeedbackCheckScreen` is a **single component reused** for stress1 and stress2 (parameterized by mode). | P0 | Same component renders both checks; mode determines which store fields are written. |
| R07-2 | Capture **stress**: "How did that feel?" with friendly faces calm→tense. | P0 (FR-8) | Selecting a face calls `setStress(mode, n)` with the right integer. |
| R07-3 | Capture **confidence**: "How sure are you that you did it right?" with faces not-sure→very-sure (neutral wording, never "did you fail?"). | P0 (FR-8) | Selecting a face calls `setConfidence(mode, n)`; wording is neutral. |
| R07-4 | `RatingScale` component is **reused** for both stress and confidence. | P0 | One component handles both questions via props (label + face set + onChange). |
| R07-5 | Faces map to integers **1–10 internally** (UI face count is a presentation choice; OQ-12). | P0 | Whatever the face count, the stored value is an integer 1–10 (clamped by store). |
| R07-6 | One primary **Continue** button; **no back-tracking** into the mode (drawing locked once submitted — matches Mode 1's "no redo" truth). | P0 | Continue advances (stress1→mode2, stress2→reflection via finalize); there is no path back into the just-played mode. |
| R07-7 | Values are stored **immediately** on selection (`mode_N_stress_level`, `mode_N_confidence_level`). | P0 | After selecting both, the draft holds the values before Continue; survives the transition. |
| R07-8 | Faces are **labeled for screen readers**; the scale is a proper labeled radiogroup/slider with values announced; not color-only. | P0 (a11y) | VoiceOver/TalkBack announces each face's value and the question; numbers/labels present, not just a gradient. |
| R07-9 | Ship a **consistent custom face set** (platform emoji vary by device) — illustrative emoji in wireframes are placeholders. | P1 | Final faces are app-shipped assets, consistent across devices (deliverable lands with PRD-011 polish). |
| R07-10 | Stress2/finalize wiring: after the second check, `finalizeSession` runs (stamps `completed_at`, moves draft→sessions, → reflection). | P0 | Completing check #2 finalizes the session and lands on Reflection reading `sessions[0]`. |

## 5. Technical approach

`FeedbackCheckScreen` reads the active mode (1 or 2) and renders two `RatingScale`
instances (stress + confidence) above a single Continue. `RatingScale` is a
controlled radiogroup of face buttons (≥44pt) that emits an integer; the screen
maps that to `setStress`/`setConfidence` (PRD-002, which clamps 1–10). Continue
calls `go('mode2')` after check #1 and `finalizeSession()` after check #2.
Wireframe: [06 §3.3](../_docs/06-ui-ux-spec.md). Copy from `content/strings.ts`
(PRD-009).

## 6. Non-functional requirements

- **a11y:** labeled faces, announced values, radiogroup semantics, 44pt targets,
  no color-only meaning (PRD-010).
- **Low friction:** the two-question check must stay quick (faces, one tap each) —
  supports SC-3 "frictionless."

## 7. Dependencies & interfaces

- **Consumes:** `setStress`/`setConfidence`/`finalizeSession`/`go` (PRD-002),
  shell/router + `Button` (PRD-004), copy + face set (PRD-009/011).
- **Provides:** populated stress + confidence on the draft → the deltas shown at
  Reflection (PRD-008) and the confidence-gap signal (SC-2c).

## 8. Test plan

- **Component (RTL):** selecting a stress face calls `setStress` with the right
  integer; selecting a confidence face calls `setConfidence`; faces are labeled for
  screen readers; Continue is the single CTA.
- **E2E:** after Mode 1, both ratings captured → Continue → Mode 2; after Mode 2,
  ratings captured → Continue → Reflection (session finalized).
- **a11y (axe + manual):** radiogroup announced; values spoken; no color-only.

## 9. Definition of Done

- Both checks capture **stress + confidence** as integers 1–10, stored immediately.
- One reused screen + one reused `RatingScale`; single Continue; no back-tracking.
- Check #2 finalizes the session → Reflection.
- Faces labeled for screen readers; 44pt targets.

## 10. Open questions & risks

- **OQ-12** confidence scale granularity (1–10 vs 1–5 faces) — faces map to 1–10
  internally; final face count decided in playtest.
- **Risk:** confidence wording could feel judgmental → keep strictly neutral
  ("how sure were you?"), verified in sensitivity review (PRD-009/010).

## 11. Traceability

FR-8 (owned). SC-2c (confidence gap), SC-3 (frictionless). ADR-012 (confidence
capture). Data fields from [03 §2](../_docs/03-data-model-and-state.md). Roadmap
Phase 3 (scaffold) + 4/5 (wired).
