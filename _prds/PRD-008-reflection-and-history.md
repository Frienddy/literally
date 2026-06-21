# PRD-008 — Reflection & History

| | |
|---|---|
| **Status** | Ready |
| **Source docs** | [01 §6](../_docs/01-game-design.md), [06 §3.5–3.6](../_docs/06-ui-ux-spec.md), [04 §2.5](../_docs/04-canvas-engine.md), [07 §6](../_docs/07-accessibility-and-ethics.md) |
| **Roadmap** | Phase 6 |
| **Depends on** | PRD-002 (store), PRD-003 (render + ghost), PRD-005/006 (drawings), PRD-007 (scores) |
| **Owns FR** | FR-9, FR-11, FR-14 (P2) · supports FR-15, FR-17 |

---

## 1. Objective

Deliver **the payoff**: the Reflection screen that shows both drawings side by
side, **reveals the intended target** (ghosted behind the Mode 1 attempt), shows
the stress **and confidence** deltas, and — for the first and only time — **names
autism** in a respectful debrief (**the reveal**). Plus the History list of past
sessions and the "Delete all my data" privacy control.

## 2. Background & context

The contrast *is* the lesson, and this is where it lands: felt first in the modes,
**named here**. The target reveal frames the Mode 1 gap as the **instructions'**
fault, never the player's. The debrief is the *only* place ASD is named
([ADR-008](../_docs/10-glossary-and-decisions.md), [01 §6](../_docs/01-game-design.md)).
Saved drawings re-render via the shared `engine/render.ts` so they look exactly as
drawn ([04 §2.5](../_docs/04-canvas-engine.md)).

## 3. Goals / Non-goals

**Goals:** `ReflectionScreen` (side-by-side previews + target reveal + deltas +
debrief), `DrawingPreview` (read-only), `TargetReveal` component, `HistoryScreen`
(list + open + delete-all), `finalizeSession` integration, optional image export.

**Non-goals:** authoring the reveal copy (PRD-009 owns `reveal.ts`; this PRD wires
the slot), the modes (PRD-005/006).

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance criterion |
|----|-------------|:--:|----------------------|
| R08-1 | Reflection reads the just-finalized session via `useLatestSession()` (`sessions[0]`). | P0 (FR-9) | After finalize, Reflection shows that session's data. |
| R08-2 | **Two drawings side by side** (stacked on very small screens), each labeled with mode name, stress, and confidence, rendered read-only via shared `render.ts`. | P0 (FR-9) | Both drawings re-render faithfully; labels + scores correct; responsive stack on small screens. |
| R08-3 | **Target reveal:** show the **intended result** (the clean target for the session's `task_id`) and faintly **ghost it behind the Mode 1 attempt** via `drawTargetGhost`. | P0 (FR-9, FR-17) | The correct task's target renders; it ghosts behind the M1 attempt so the gap is visible. |
| R08-4 | The reveal framing indicts the **instructions, not the player** ("Both times you were asked for *this*…"). | P0 | Copy + layout never blame the player; verified against ethics gate. |
| R08-5 | **The reveal (naming it):** a short respectful debrief connects the felt difficulty to how a simple task can be hard for an autistic child without direct instructions, and frames clear/literal/structured communication as **accessibility**. This is the **first** place ASD is named. | P0 (FR-9) | Debrief renders from `reveal.ts`; ASD appears nowhere earlier in the flow. |
| R08-6 | **Stress & confidence deltas** shown (e.g., "Stress 7 → 2 · Confidence 3 → 9"), framed as personal reflection, never a score/judgment. | P0 (FR-9) | Both deltas computed from the session and displayed; neutral framing. |
| R08-7 | Required disclaimers present in the reveal: one slice, **not** a diagnosis/test, people vary. | P0 | The three disclaimers are visible in the debrief copy ([07 §1,§6](../_docs/07-accessibility-and-ethics.md)). |
| R08-8 | Actions: **Save** (auto on finalize, confirmed), **View past sessions** (→ History), **Play again** (→ new session/Welcome). | P0 | Each action works; Save is implicit via finalize; Play again starts fresh. |
| R08-9 | `HistoryScreen`: list past sessions **newest-first**, each tappable to open its saved reflection; shows date + stress delta + thumbnails. | P1 (FR-11) | Sessions list newest-first; tapping one opens its reflection with faithful drawings. |
| R08-10 | **"Delete all my data"** in History wipes local storage via `clearAllData`, with confirmation. | P0/P1 (FR-15) | Confirming deletion empties sessions, resets storage; cancel does nothing. |
| R08-11 | Opening a **past** session renders the same Reflection layout from stored data (drawings, scores, target for its `task_id`). | P1 (FR-11) | A historical session re-renders correctly, including the right task's target. |
| R08-12 | **Image export** (`lib/exportImage.ts`): render the comparison to a PNG/blob for share/save. | P2 (FR-14) | If shipped, a Share/Export produces a PNG of the comparison; gracefully absent if deferred to v1.1. |
| R08-13 | Target-reveal/preview rendering respects `prefers-reduced-motion` (target fades in, or appears instantly under reduced motion). | P1 | Under reduced motion, the reveal appears without animation. |

## 5. Technical approach

`ReflectionScreen` uses `DrawingPreview` (a read-only canvas calling
`engine/render.ts`) for each drawing, `drawTargetGhost` behind the M1 attempt, and
`TargetReveal` for the intended result. The target geometry comes from
`content/tasks.ts` (per `task_id`) — the same data Mode 2 builds (PRD-006). Deltas
are computed from `sessions[0]`. Debrief copy from `content/reveal.ts` (PRD-009) —
**the only file allowed to name ASD**. `HistoryScreen` lists `useSessions()` and
reuses the Reflection layout for a selected session. Optional `exportImage.ts`
composes the previews onto an offscreen canvas → `toBlob`. Wireframes:
[06 §3.5–3.6](../_docs/06-ui-ux-spec.md).

## 6. Non-functional requirements

- **a11y:** AA contrast on all reflection text; saved drawings get a text summary
  ("your freehand house," "your grid house"); semantic landmarks; reduced-motion
  respected (PRD-010).
- **NFR-4 Privacy:** delete-all genuinely wipes storage; no network on export
  (export is local-only).
- **Ethics:** debrief avoids burden/pity/universality framing ([07 §6](../_docs/07-accessibility-and-ethics.md)).

## 7. Dependencies & interfaces

- **Consumes:** `useLatestSession`/`useSessions`/`clearAllData` (PRD-002),
  `engine/render.ts` + `drawTargetGhost` (PRD-003), drawings (PRD-005/006), scores
  (PRD-007), `tasks.ts` + `reveal.ts` (PRD-009).
- **Provides:** the completed payoff loop; the share artifact for facilitators.

## 8. Test plan

- **Component (RTL):** Reflection renders both `DrawingPreview`s, the target
  reveal, and both stress + confidence values from a seeded session; History lists
  newest-first; delete-all clears + confirms.
- **E2E (Playwright):** full happy path → Reflection shows two drawings + target
  reveal + both scores → reload → session still in History → open it → re-renders.
- **Content test:** ASD/autism terms appear in `reveal.ts` only (paired with the
  welcome no-spoiler test in PRD-009).
- **a11y:** saved-drawing text summaries; AA contrast; reduced-motion reveal.

## 9. Definition of Done

- Both drawings re-render faithfully; the intended target reveal renders for the
  session's `task_id`; stress + confidence deltas shown.
- The reveal names ASD respectfully with required disclaimers; framing blames the
  instructions, not the player.
- History works; deletion wipes storage with confirmation.
- (If in scope) image export produces a PNG locally.

## 10. Open questions & risks

- **OQ-3** ship image export in v1 vs v1.1 — P2; ship if cheap, else v1.1.
- **OQ-9** how explicitly the reveal names autism — name it clearly as *one slice*,
  never universalized; decided in sensitivity review (PRD-009).
- **Risk:** target reveal could read as "you failed" → strict instructions-not-
  player framing, ethics-gated.

## 11. Traceability

FR-9, FR-11 (owned); FR-14 (P2), FR-15, FR-17 (support). NFR-4, NFR-6. ADR-008
(reveal here only), ADR-010 (hidden target reveal), ADR-012 (confidence delta),
ADR-013 (target ghost). SC-2 (the aha), SC-2b, SC-2c, SC-5 (survives reload).
Roadmap Phase 6 DoD.
