# PRD-006 — Mode 2: "Anchor Point"

| | |
|---|---|
| **Status** | Ready |
| **Source docs** | [01 §4](../_docs/01-game-design.md), [06 §3.4](../_docs/06-ui-ux-spec.md), [04 §2.3,§2.5](../_docs/04-canvas-engine.md) |
| **Roadmap** | Phase 5 (independent of PRD-005 once 002–004 land) |
| **Depends on** | PRD-002 (store), PRD-003 (canvas+haptics+guidance), PRD-004 (shell/router) |
| **Owns FR** | FR-4, FR-18 · supports FR-1, FR-3, FR-6, FR-16, FR-17, FR-19, FR-23 |

---

## 1. Objective

Deliver the **structured experience**: a high-contrast snap-to-grid canvas where
the player connects dots, with **one literal instruction step at a time**, explicit
progress, on-grid visual guidance (pulsing start node + ghosted target path),
**Undo**, crisp confirming haptics, **no timers**, and a satisfying completion
moment ("Perfect — exactly right!"). Emotional target: total control,
predictability, calm, mastery.

## 2. Background & context

Mode 2 is the "with clear instruction" half of the contrast. It builds the **same**
intended target as Mode 1 (the hidden target), but here the target is fully
knowable: literal grid moves, persistent re-readable cards, visible guidance. This
is what makes "with instruction" feel effortless — the opposite of Mode 1's
nothing. See [01 §4](../_docs/01-game-design.md), [06 §3.4](../_docs/06-ui-ux-spec.md).

## 3. Goals / Non-goals

**Goals:** `AnchorPointScreen` (grid canvas), `StepInstruction` (one-card
pagination + Next/Undo/Back/progress, no timers), authored `mode2.steps.ts` (house,
exact coords) + grid spec, crisp snap haptics, on-grid guidance via
`drawStepGuidance`, the Grown-up's clear ask + completion moment.

**Non-goals:** the engine/snap math (PRD-003), the feedback screen (PRD-007), the
Reflection target reveal (PRD-008 — though this PRD defines the target data).

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance criterion |
|----|-------------|:--:|----------------------|
| R06-1 | `AnchorPointScreen` mounts `useCanvas({mode:'grid', grid})`: high-contrast grid with clear nodes; connect-the-dots tool. | P0 (FR-1, FR-3) | A grid of nodes renders; dragging between nodes draws clean straight segments. |
| R06-2 | **Snap-to-grid:** endpoints strictly snap to nearest node; no "between-node" output; lines crisp, no wobble. | P0 (FR-3) | Every committed segment connects two integer grid nodes; output is always clean. |
| R06-3 | `StepInstruction`: exactly **one** instruction card visible at a time; persistent/re-readable until advanced. | P0 (FR-4) | Only one card shows; it stays until Next; opposite of Mode 1 decay. |
| R06-4 | A large clear **"Next Step"** advances; **no timers, no auto-advance** — player's pace. | P0 (FR-4) | Steps only advance on explicit Next; no timer/auto-advance anywhere. |
| R06-5 | **"Undo Step"** reverts the last segment/action; optional **"Back"** re-reads a prior step. | P0 (FR-4) | Undo removes the last segment and re-renders; Back returns to the prior card. |
| R06-6 | Explicit progress "Step X of N" always shown. | P0 (FR-4) | Progress reads correctly at every step (e.g., 3 of 8). |
| R06-7 | On-grid guidance: current step's **start node pulses** and target move shown as a faint **ghost segment** via `drawStepGuidance` (phase-driven pulse). | P1 (FR-18) | The correct start node pulses and the correct target move is ghosted for the current step. |
| R06-8 | Crisp confirming haptic on snap to a **new** node via `onHaptic('snap')` → single short pulse (`vibrate(15)`); optional distinct pulse on step completion. | P0 (FR-6) | Snap haptic fires once per new node (Android); softened under reduced-intensity. |
| R06-9 | Author `mode2.steps.ts`: ordered, literal, **unambiguous, verifiable** step cards for the canonical subject (house, ~8 steps) + the target coordinates. | P0 (FR-17) | The step sequence reproduces the canonical target exactly; coords finalized. |
| R06-10 | `grid` spec (cols×rows, cell size, origin) defined (~8×10) and shared with the engine + the stored `GridDrawing.grid`. | P0 | Grid spec is consistent between render, snap, and saved data. |
| R06-11 | The Grown-up's **clear ask** (calm, literal, patient) is shown via `GuideMascot`. | P1 (FR-16) | The clear ask renders from `giver.copy.ts`; reads warm + patient. |
| R06-12 | **Completion moment:** when the last step lands, the drawing "finishes" with a calm flourish and the Grown-up beams ("Perfect — exactly right!"); soft confirm haptic. | P1 (FR-19) | On final step, the completion beat plays (`tokens.motion.giverBeatMs`), then advances. |
| R06-13 | On completion: capture drawing data → `saveMode2Drawing` → `go('stress2')`. | P0 | `mode_2_drawing_data` is populated (grid segments + grid spec); flow advances to Feedback#2. |
| R06-14 | No distractions, no notifications, no fading — the screen is quiet. | P0 | Nothing fades, drifts, or interrupts in Mode 2. |
| R06-15 | Apply the **anchor theme** (bright, high-contrast, airy) via the PRD-004 theming wrapper; optional storm→anchor transition on entry. | P1 (FR-23) | Mode 2 renders in the anchor theme, visually opposite to Mode 1. |

## 5. Technical approach

`AnchorPointScreen` composes the `Canvas` (PRD-003) in grid mode with the `grid`
spec, plus `StepInstruction`, `GuideMascot`, and the completion `GiverBeat`. Snap
math + `drawStepGuidance` come from the engine ([04 §2.3,§2.5](../_docs/04-canvas-engine.md)).
Step cards + coords live in `content/mode2.steps.ts` and `content/tasks.ts` (target
per subject) — authored here for the canonical subject, finalized/expanded in
PRD-009. Example 8-step house sequence: [01 §4.2](../_docs/01-game-design.md).
Wireframe: [06 §3.4](../_docs/06-ui-ux-spec.md). Crisp haptics via `useHaptics`.

**One decision per screen:** Next is the single dominant CTA; Undo/Back are
secondary. Cards are big and high-contrast (≥`tokens.font.sizeStep`).

## 6. Non-functional requirements

- **NFR-1:** snapping + guidance pulse stay at 60fps.
- **a11y:** step cards are semantic, labeled, announced (PRD-010); Next/Undo
  keyboard/switch operable where feasible; success uses shape/position + haptic +
  highlight, not color alone.
- **No reliance on haptics:** snap success also reads visually (node "pop" + clean
  lock) for iOS.

## 7. Dependencies & interfaces

- **Consumes:** `Canvas`/`useCanvas` grid mode + `drawStepGuidance` + `useHaptics`
  (PRD-003), store actions (PRD-002), shell/router/components + anchor theme
  (PRD-004), copy slots (PRD-009).
- **Provides:** completed Mode 2 + `mode_2_drawing_data`, **and the canonical
  target data** that Reflection's reveal renders (PRD-008).

## 8. Test plan

- **E2E (Playwright touch):** drag across nodes builds the house via literal steps;
  one segment per node-pair; snap segments have integer nodes; Undo reverts; Next
  advances; completing final step → Feedback#2.
- **Component (RTL):** `StepInstruction` shows one card; Next advances; Back
  returns; progress "Step X of N" correct; **no auto-advance/timer**.
- **Unit:** the authored step sequence reproduces the target (geometry check).
- **a11y:** guidance highlights the **correct** start node/target for each step;
  cards announced; 44pt targets.
- **Manual real-device:** crisp snap haptic on Android; iOS visual snap reads as
  satisfying.

## 9. Definition of Done

- Player completes the house via literal steps; snapping + Undo + progress +
  on-grid guidance work; finishing → Feedback#2; nothing fades, no distractions.
- Completion moment plays; `mode_2_drawing_data` saved with grid spec.
- Step coords finalized; guidance points at the right node/target each step.

## 10. Open questions & risks

- **OQ-5** exact step coordinates + grid size — finalize here (~8×10).
- **OQ-10** task pool + each task's grid target — house first; cat/flower in PRD-009.
- **Risk:** snap tolerance too tight/loose → tune via `isWithinSnap` tolerance on
  device.

## 11. Traceability

FR-4, FR-18 (owned); FR-1, FR-3, FR-6, FR-16, FR-17, FR-19, FR-23 (support).
NFR-1. ADR-010 (hidden target), ADR-011 (giver + completion), ADR-013 (guidance,
anchor theme). SC-1, SC-2c (confidence high after M2). Roadmap Phase 5 DoD.
