# PRD-005 — Mode 1: "Sensory Storm"

| | |
|---|---|
| **Status** | **Done** — code + automated tests complete; real-device haptics + sensory-safety playtest pending hardware (see §9) |
| **Source docs** | [01 §3](../_docs/01-game-design.md), [06 §3.2](../_docs/06-ui-ux-spec.md), [07 §3](../_docs/07-accessibility-and-ethics.md) |
| **Roadmap** | Phase 4 (independent of PRD-006 once 002–004 land) |
| **Depends on** | PRD-002 (store), PRD-003 (canvas+haptics), PRD-004 (shell/router) |
| **Owns FR** | FR-5, FR-7, FR-22 · supports FR-1, FR-2, FR-6, FR-16, FR-19, FR-23 |

---

## 1. Objective

Deliver the **overload experience**: a blank wobbly canvas, a single vague
instruction that fades from memory, erratic haptics while drawing, fake
notifications stealing focus, **no undo**, the Grown-up's vague ask, and a gentle
"not quite what I meant" beat on finish. Emotional target: *mild* frustration,
ambiguity, loss of control — **never** distress.

## 2. Background & context

Mode 1 is the "without clear instruction" half of the core contrast. Every
mechanic pushes the emotional target ([01 §3](../_docs/01-game-design.md)). It is
also the **sensory-safety risk surface** ([07 §3](../_docs/07-accessibility-and-ethics.md)):
intensity must be tunable, a calm exit always reachable, and the discomfort
"annoying/confusing," never "distressing." The hidden target is **never shown**
here (revealed only at Reflection — PRD-008).

> **Golden rule:** "ugh, that was annoying and confusing," not panic.

## 3. Goals / Non-goals

**Goals:** `SensoryStormScreen` (freehand canvas), `VagueInstruction` (fading
text), `FakeNotifications` (distraction layer), erratic haptics wiring, no-undo,
small "Done" → Feedback#1, the Grown-up's vague ask + the "not quite right" beat,
persistent Exit + reduce-intensity.

**Non-goals:** the canvas engine itself (PRD-003), the feedback screen (PRD-007),
the copy text (authored in PRD-009 — this PRD wires the slots), the reveal (PRD-008).

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance criterion |
|----|-------------|:--:|----------------------|
| R05-1 | `SensoryStormScreen` mounts `useCanvas({mode:'freehand', wobble})`: blank canvas, no grid, no guides, no reference. | P0 (FR-1, FR-2) | Drawing produces wobbly freehand strokes; no grid/guide is ever rendered. |
| R05-2 | **No Undo** anywhere in Mode 1. | P0 | No undo affordance exists; strokes are permanent. |
| R05-3 | `VagueInstruction`: a single large vague text block that is fully legible ~3s then fades/drifts away, gone by ~12–15s; **no way to summon it back**. | P0 (FR-5) | Text decays per `tokens.motion.fadeMs`; there is no "show again" control. |
| R05-4 | `FakeNotifications`: fake push toasts slide in from top and auto-dismiss; jittered cadence ~4–8s; visible ~2.2s; **never** cover the whole canvas or trap input; non-interactive. | P1 (FR-7) | Notifications appear/dismiss on a jittered cadence; tapping does nothing; canvas stays drawable. |
| R05-5 | Erratic haptics on movement via `onHaptic('move')` → throttled/jittered erratic pattern. | P0 (FR-6) | Buzz fires while drawing on Android; throttled (not per move event); suppressed under reduced-intensity. |
| R05-6 | The **Grown-up's vague ask** is shown (warm but assuming) via `GuideMascot`; the words then fade (ties into R05-3). | P1 (FR-16) | The vague ask renders from `giver.copy.ts` (PRD-009 slot); reads warm, not blaming. |
| R05-7 | A single, slightly-too-small **"Done"** affordance — still ≥44pt tappable (fake the *feeling* of imprecision, not actual inaccessibility). | P0 | "Done" is visually smaller but meets the 44pt minimum and is reliably tappable. |
| R05-8 | On Done: a gentle, **mildly-puzzled** beat ("Hmm… not quite what I had in mind. But okay!") via `GiverBeat`, shown ~2s, **skippable**, blames the *instructions* never the player. | P1 (FR-19) | Beat shows ~`tokens.motion.giverBeatMs`, is skippable, never blocks progress, never scolds. |
| R05-9 | On Done (after/with the beat): capture drawing path data → `saveMode1Drawing` → `go('stress1')`. | P0 | `mode_1_drawing_data` is populated; flow advances to Feedback#1. |
| R05-10 | **Persistent calm Exit** ("✕ Exit") + the reduce-intensity control stay reachable the entire time (survive the chaos). | P0 (FR-22) | Exit and reduce-intensity are always visible/tappable in Mode 1; Exit leaves to a neutral screen without penalty. |
| R05-11 | Reduced-intensity meaningfully softens Mode 1: suppress erratic buzz (soft confirm only), fewer/slower notifications never overlapping the canvas, gentler text fade, raised vague-text contrast. | P0 (FR-22, NFR-6) | Toggling reduce-intensity verifiably changes all four channels. |
| R05-12 | `prefers-reduced-motion`: no drifting/parallax; text fades gently; discomfort still conveyed via content/contrast. | P0 (NFR-6) | With reduced-motion on, no drift/auto-scroll; Mode 1 still reads as effortful. |
| R05-13 | Apply the **storm theme** (murky, desaturated, vignette) via the PRD-004 theming wrapper. | P1 (FR-23) | Mode 1 renders in the storm theme distinct from Mode 2. |
| R05-14 | The hidden target is **never** displayed in Mode 1. | P0 (FR-17) | No reference image/target appears anywhere in Mode 1. |

## 5. Technical approach

`SensoryStormScreen` composes the `Canvas` (PRD-003) in freehand mode with
`wobble` config from `src/config.ts`, plus `VagueInstruction`, `FakeNotifications`,
`GuideMascot`/`GiverBeat`, `ExitButton`, and the reduce-intensity toggle. Timings
(`fadeMs`, `notifyEveryMs`, `notifyVisibleMs`, `giverBeatMs`) come from
`tokens.motion` ([06 §4](../_docs/06-ui-ux-spec.md)). Haptics via `useHaptics`
(PRD-003). All copy comes from `content/` slots filled in PRD-009
(`mode1.instructions.ts`, `giver.copy.ts`, `notifications.ts`) — **no baked
strings**. Wireframe: [06 §3.2](../_docs/06-ui-ux-spec.md).

**Distraction safety rails:** notifications must never fully cover the canvas or
permanently trap input; cadence jittered; auto-dismiss guaranteed. Optional ambient
drift is tasteful and reduced-motion aware.

## 6. Non-functional requirements

- **NFR-1:** drawing stays 60fps even with notifications + fade animations running.
- **NFR-6 / sensory safety:** reduced-intensity + reduced-motion paths mandatory;
  no flashing >3Hz; no startling audio (ADR-005); calm exit always present.
- **Ethics:** the beat and the whole mode must read as the *instructions* failing,
  never the player (PRD-010 / [07 §2](../_docs/07-accessibility-and-ethics.md)).

## 7. Dependencies & interfaces

- **Consumes:** `Canvas`/`useCanvas` + `useHaptics` (PRD-003), store actions
  `saveMode1Drawing`/`go`/`reducedIntensity` (PRD-002), shell/router/components +
  storm theme (PRD-004), copy slots (PRD-009).
- **Provides:** a completed Mode 1 + `mode_1_drawing_data` for Reflection (PRD-008).

## 8. Test plan

- **E2E (Playwright):** draw a freehand stroke → advance to Feedback#1; **no Undo**
  present; notifications never trap input; reduce-intensity toggle changes behavior.
- **Component (RTL):** `VagueInstruction` fades and exposes no recall control;
  `FakeNotifications` jittered cadence + auto-dismiss; `GiverBeat` is skippable and
  non-blocking; Exit always rendered.
- **a11y:** reduced-motion path; reduced-intensity meaningfully softens; "Done"
  meets 44pt; canvas `aria-label` describes purpose.
- **Manual real-device:** erratic haptic on Android; iOS visual-only still conveys
  discomfort; feels mildly frustrating, not distressing (playtest, SC-1).

## 9. Definition of Done

**Code & automated — complete ✅**

- [x] Real `SensoryStormScreen` composes the freehand+wobble `useCanvas` island
  (blank canvas, no grid/guide/reference — R05-1/R05-14), **no Undo anywhere**
  (R05-2), the storm theme via `ModeTheme` (R05-13), and saves
  `mode_1_drawing_data` → `go('stress1')` on finish (R05-9).
- [x] `VagueInstruction` — the ask + block fade from memory via an **imperative
  rAF opacity** (immune to the global reduced-motion `transition` kill so it still
  fades gently — R05-12) with **no recall control** (R05-3/R05-6); the pure
  `fadeOpacity` curve is unit-tested.
- [x] `FakeNotifications` — mundane toasts on a jittered ~4–8s cadence, always
  auto-dismiss, `pointer-events-none` (never trap input — R05-4); erratic move
  haptics via `useHaptics` (R05-5); the gently-puzzled **`GiverBeat`** ("not quite
  right") is brief + skippable + blames the instructions (R05-8).
- [x] Persistent calm **Exit** + **reduce-intensity** toggle reachable throughout
  (R05-10); reducing intensity verifiably softens all four channels — haptics,
  notifications (fewer/slower, off-canvas), text fade (gentler), vague-text
  contrast (raised) (R05-11).
- [x] **Freehand stroke ink (DEBT-006, follow-up):** the Mode 1 stroke uses a
  distinct `tokens.color.stormInk` (≈3.1:1 on the storm canvas — legible yet
  effortful) instead of the near-invisible committed ink, raised to
  `stormInkReduced` (≈5:1) under reduce-intensity. Saved previews still re-render
  with the committed ink on their light surface.
- [x] Verified: `tsc`/ESLint/Prettier clean, **98 Vitest unit** (fade curve,
  `VagueInstruction` no-recall + raised contrast, `FakeNotifications`
  cadence/auto-dismiss/non-interactive, the beat walk in `navigation.test`),
  **26 Playwright E2E** on Mobile Safari + Chrome (wobbly stroke → freehand
  payload, no-undo, Done → beat → Feedback #1, reduce-intensity toggles, calm Exit;
  all prior specs still green), production `vite build` (main ~60 KB gzip).

**Real-device / playtest — pending hardware ⏳ (`_docs/09` §6; cannot be done in CI/emulator)**

- [ ] Erratic move haptic fires on **Android**; **iOS Safari** no-ops cleanly and
  the discomfort still reads via visual + motion channels.
- [ ] Plays as designed and feels **mildly frustrating, never distressing**
  (golden rule / SC-1); reduced-intensity + reduced-motion paths confirmed calming
  on device; the beat reads as the *instructions* falling short, never the player
  (ethics-gate / SC-6).

## 10. Open questions & risks

- **OQ-6** wobble values (3px/0.18 start) tuned here in playtest.
- Notification copy set kept mundane, never alarming (OQ in [01 §10](../_docs/01-game-design.md)).
- Whether Mode 1 has any soft time pressure beyond text fade — **lean no** for v1.
- **Risk:** over-intensity → tune conservatively; when in doubt, dial down.

## 11. Traceability

FR-5, FR-7, FR-22 (owned); FR-1, FR-2, FR-6, FR-16, FR-17, FR-19, FR-23 (support).
NFR-1, NFR-6. ADR-003, ADR-005, ADR-011 (giver + beat), ADR-013 (storm theme).
SC-1 (felt contrast), SC-6 (respectful). Roadmap Phase 4 DoD.
