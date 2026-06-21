# 08 — Implementation Roadmap

A phased, dependency-ordered build plan. Each phase has a clear goal, the tasks
inside it, and a Definition of Done (DoD). Phases are sized so each ends with
something runnable/testable on a phone.

---

## Phase 0 — Project scaffold & guardrails
**Goal:** an installable, gesture-locked empty shell running offline on a phone.

Tasks
- Scaffold Vite + React + TS (`npm create vite@latest -- --template react-ts`).
- Add Tailwind; wire `tailwind.config.ts` to design tokens (doc 06 §4).
- Add `vite-plugin-pwa`, manifest, icons; register SW (doc 05 §3).
- Implement global gesture-blocking CSS + `usePreventGestures` (doc 05 §1).
- Implement `AppShell`, `useOrientation`, `PortraitGuard` (doc 05 §2).
- Set up ESLint/Prettier, strict TS, Vitest, Playwright.

DoD
- App installs to home screen on a real iPhone *and* Android.
- Loads in airplane mode after first visit.
- No pull-to-refresh, no text selection, no double-tap zoom; landscape shows
  PortraitGuard.

## Phase 1 — Data model & store
**Goal:** sessions persist across reloads.

Tasks
- Implement `types/session.ts` (doc 03 §2).
- Implement `gameStore.ts` with `persist`, `partialize`, `migrate` (doc 03 §3).
- Implement selectors, `migrations.ts`, `lib/id.ts`, `lib/time.ts`.
- Add `task_id` (random task pool), `*_confidence_level` fields, and
  `setConfidence` (doc 03).
- Unit-test store lifecycle (start → save drawings → stress → confidence →
  finalize) and migration fallback.

DoD
- A fake session created in devtools survives a reload.
- Stress/confidence clamp (1–10), `task_id` set + shared by both modes, finalize
  moves draft→sessions, `clearAllData` works.

## Phase 2 — Canvas engine (the heart)
**Goal:** both drawing behaviors work, smoothly, on touch.

Tasks
- Implement pure engine: `geometry.ts`, `wobble.ts`, `snap.ts`, `render.ts` (doc 04 §2).
- Implement `useCanvas` (doc 04 §3) + `Canvas` component + DPR handling.
- Implement `useHaptics` (doc 05 §4); wire `onHaptic` → vibrate.
- Unit-test engine (determinism, snapping, simplify ratio); E2E touch draw.

DoD
- Freehand draws with visible-but-usable wobble at 60fps; no input lag.
- Grid mode snaps endpoints to nodes; crisp haptic on each new node (Android).
- Undo/Reset work; `onChange` emits correct `DrawingData` payloads.

## Phase 3 — Screen flow & navigation
**Goal:** the full FSM walks end to end with placeholder content.

Tasks
- `App.tsx` + `ScreenRouter` switch on `store.screen` (doc 02 §3).
- Build all screen shells: Welcome, Mode1, Feedback, Mode2, Feedback, Reflection,
  History — wired to store transitions (doc 01 §7, doc 06).
- `RatingScale` (emoji faces) capturing **stress + confidence**, reused for both
  checks; `FlowProgress` top-level 5-step indicator.

DoD
- Can traverse welcome→…→reflection→history→welcome with stub UIs; state
  transitions correct; back-swipe does nothing (single document).

## Phase 4 — Mode 1 "Sensory Storm"
**Goal:** the overload experience is complete and tuned.

Tasks
- `SensoryStormScreen` using `useCanvas({mode:'freehand', wobble})`.
- `VagueInstruction` fading/scrolling text (doc 01 §3.2; timings in tokens).
- `FakeNotifications` distraction layer (jittered cadence; never traps input).
- Wire erratic haptics; ensure **no Undo**; small "Done" → Feedback#1.
- Add the Grown-up's **vague ask** + the gentle **"not quite right" beat**
  (`GuideMascot`/`GiverBeat`; ethics doc 07 §2); hidden target is never shown.
- Keep **Exit / reduce-intensity** persistent and reachable (doc 07 §3).

DoD
- Plays as designed; feels mildly frustrating; reduced-intensity meaningfully
  softens it; respects reduced-motion; calm exit present.

## Phase 5 — Mode 2 "Anchor Point"
**Goal:** the structured experience is complete.

Tasks
- `AnchorPointScreen` using `useCanvas({mode:'grid', grid})`.
- `StepInstruction` one-card-at-a-time pagination + `Next`/`Undo`/progress
  (doc 01 §4.2). No timers.
- Author `mode2.steps.ts` (the house, exact coords) + grid spec.
- Wire crisp snap haptics; Undo reverts last segment.
- Add the Grown-up's **clear ask**, on-grid **guidance** (pulse start node +
  ghost path via `drawStepGuidance`, doc 04 §2.5), and the **completion moment**
  ("Perfect!").

DoD
- Player completes the house via literal steps; snapping + Undo + progress +
  on-grid guidance work; finishing → Feedback#2; nothing fades, no distractions.

## Phase 6 — Reflection & history
**Goal:** the payoff and persistence loop.

Tasks
- `ReflectionScreen`: side-by-side `DrawingPreview`s (shared `render.ts`), the
  **target reveal** (`drawTargetGhost`, doc 04 §2.5), stress **and confidence**
  deltas, debrief copy (doc 07 §6).
- `HistoryScreen`: list past sessions, open a saved reflection, "Delete all data".
- `finalizeSession` integration; reflection reads `sessions[0]`.

DoD
- Both drawings re-render faithfully; the intended target reveal renders for the
  session's `task_id`; stress + confidence deltas shown; history works; deletion
  wipes storage with confirmation.

## Phase 7 — Content, copy & ethics pass
**Goal:** all words are right and reviewed.

Tasks
- Fill `content/strings.ts`, `mode1.instructions.ts`, `notifications.ts`.
- Author `giver.copy.ts` (vague/clear lines + the two beats) and `tasks.ts`
  (the task pool: vague text + grid target per subject).
- Author `welcome.copy.ts` — **minimal, no-spoiler** setup that does NOT name ASD
  (doc 07 §1; show, don't tell).
- Author `reveal.ts` — the Reflection reveal, the *only* place ASD is named
  (doc 01 §6; doc 07 §6).
- Verify a no-prior-knowledge reader of the welcome can't tell it's "about autism."
- Sensitivity review (autistic reviewers if possible); apply feedback.

DoD
- Ethics release-gate checklist (doc 07 §7) fully green.

## Phase 8 — Polish, perf & QA
**Goal:** ship-quality on real devices.

Tasks
- Perf pass: confirm <16ms input→ink, 60fps, lean bundle (PRD NFR-1/3).
- Cross-device matrix (doc 09): iOS Safari + Android Chrome, multiple sizes.
- Newcomer-comprehension playtest: recruit testers with **no prior ASD knowledge**;
  confirm the reveal lands *without* the point having been taught up front
  (doc 09 §5; SC-2b).
- **Visual polish (§D):** two themes (storm/anchor) + the storm→anchor transition;
  custom icon/face set replacing platform emoji; snap "pop" and beat
  micro-interactions — all reduced-motion aware.
- Optional FR-14 image export (`lib/exportImage.ts`) if in scope.
- Lighthouse PWA audit (installable, offline, best practices).

DoD
- All P0 functional + non-functional requirements met; QA matrix green;
  Lighthouse PWA ✓.

---

## Milestones

| Milestone | Phases | Outcome |
|-----------|--------|---------|
| **M1 — Walkable skeleton** | 0–3 | Installable PWA, persists data, full flow with stubs |
| **M2 — Playable core** | 4–6 | Both modes + reflection fully functional |
| **M3 — Reviewed & shippable** | 7–8 | Copy + ethics done, polished, QA-passed |

## Suggested build order rationale
Guardrails (0) and data (1) first because everything depends on them; the canvas
engine (2) is the riskiest/highest-value piece so it's de-risked early; flow (3)
stitches screens before filling each mode (4,5); reflection (6) needs both modes;
content/ethics (7) and polish (8) last. Modes 1 and 2 (Phases 4 & 5) are
independent once Phase 2+3 land and can be built in parallel by two people.

## Definition of Done (global)
A feature is done when: it meets its DoD above, has tests where doc 09 specifies,
works on a real iPhone and Android device, makes no network calls (verified
offline), and — for anything player-facing — passed the ethics checklist.
