# 10 — Glossary & Decision Log

Shared vocabulary and the Architecture Decision Records (ADRs) plus the open
questions tracked across the docs.

---

## 1. Glossary

| Term | Meaning |
|------|---------|
| **Mode 1 / Sensory Storm** | The overload experience: blank canvas, freehand+wobble, vague fading text, erratic haptics, fake notifications, no undo. |
| **Mode 2 / Anchor Point** | The structured experience: high-contrast grid, snap-to-grid, one literal step at a time, crisp haptics, undo, no timers. |
| **Stress check** | The 1–10 self-rating screen shown after each mode. |
| **Reflection** | Final screen comparing both drawings + stress scores with a respectful debrief. |
| **GameSession** | The persisted record of one full playthrough (doc 03 §2). |
| **DrawingData** | Discriminated union: `FreehandDrawing` (Mode 1, pixels) or `GridDrawing` (Mode 2, grid nodes). |
| **Wobble** | Seeded, smooth perpendicular noise added to freehand strokes (doc 04 §2.2). |
| **Snap-to-grid** | Forcing line endpoints onto the nearest grid node (doc 04 §2.3). |
| **App shell** | The precached HTML/CSS/JS that makes the PWA load offline. |
| **FSM / `screen`** | The store-driven finite state machine governing navigation. |
| **Reduced intensity** | Persisted sensory-safety mode that softens Mode 1 (doc 07 §3). |
| **Calm exit** | Always-available, penalty-free way to leave Mode 1. |
| **DPR** | `devicePixelRatio`; used to keep canvas crisp on retina screens. |
| **Show, don't tell / experiential-first** | The core pedagogy: the player *feels* the lesson through play; we never explain it beforehand. |
| **The reveal** | The Reflection screen — the *first and only* place autism is named and the point is stated, after it's been felt. |
| **Zero-knowledge audience** | The primary player: someone who knows nothing about ASD and has never considered how autistic people experience the world. |
| **Without/with instruction** | The two modes framed plainly: Mode 1 = *without* clear instruction; Mode 2 = *with* clear instruction. |
| **Instruction-giver / the Grown-up** | The warm teacher/parent character who assigns the task — vague in Mode 1, clear in Mode 2; kind in both, never blames the player. |
| **Hidden target / target reveal** | The single intended result (identical in both modes), never shown in Mode 1, revealed at Reflection to expose the gap. |
| **"Not quite right" / completion beat** | Mode 1's gentle puzzled reaction on Done; Mode 2's "Perfect!" on finishing. |
| **Feedback check** | The post-mode screen capturing both **stress** and **confidence** (emoji faces). |
| **Confidence gap** | Lower confidence after Mode 1 than Mode 2 — the cleanest measure of "couldn't tell if I did it right." |
| **Task pool** | The set of simple subjects (house / cat / flower) picked at random per session; both modes share one. |
| **Two visual worlds** | Storm (murky, desaturated, cramped) vs Anchor (bright, airy, crisp), with a "fog-clearing" transition. |

## 2. Architecture Decision Records

### ADR-001 — Frontend-only, local-first, no backend
**Status:** Accepted.
**Context:** Spec requires fully offline, on-device, no backend.
**Decision:** Zero runtime network. Static PWA precached by a service worker;
all data in on-device storage.
**Consequences:** No accounts/sync/server analytics in v1; strong privacy story;
all "persistence" is browser storage with its quotas/migration concerns.

### ADR-002 — Zustand `persist` (localStorage) with an IndexedDB escape hatch
**Status:** Accepted.
**Context:** Spec allows Zustand-persist *or* localStorage/IndexedDB. Drawing
payloads can be large.
**Decision:** Zustand `persist` over localStorage by default; simplify+quantize
freehand data before saving; keep the `storage:` seam so we can swap to an
IndexedDB `StateStorage` adapter if a session exceeds ~150KB.
**Consequences:** Simple synchronous reads now; clean upgrade path later without
touching store logic. (Details: doc 03 §1, §6.)

### ADR-003 — Haptics are an enhancement, never a dependency
**Status:** Accepted.
**Context:** `navigator.vibrate` is unsupported on iOS Safari.
**Decision:** Wrap vibration in `useHaptics` with feature detection; never gate
progression on haptics; ensure Mode 1 discomfort and Mode 2 satisfaction also
read through visual/motion channels.
**Consequences:** iPhone users get a slightly thinner sensory layer but the full
experience; no broken behavior where vibration is absent. (Doc 05 §4.)

### ADR-004 — Block native gestures in depth; rely on standalone install for back-swipe
**Status:** Accepted.
**Context:** No web API fully disables iOS edge-swipe-back; single APIs don't
cover all browsers.
**Decision:** CSS + viewport meta + JS guards for pull-to-refresh, selection,
zoom; single-document FSM (no history to swipe); promote PWA install
(`display: standalone`) which removes browser chrome and the back-swipe entirely.
**Consequences:** Best-in-class behavior when installed; graceful in-browser;
install guidance surfaced in UI. (Doc 05 §1–2.)

### ADR-005 — No startling audio in v1
**Status:** Accepted.
**Context:** Sudden audio is a sensory-safety risk and clashes with the
respectful tone.
**Decision:** Ship no jarring sound. Any future audio must be opt-in and gentle.
**Consequences:** Mode 1 intensity comes from motion/haptics/interruptions, not
sound — safer and more inclusive. (Doc 01 §9, doc 07 §3.)

### ADR-006 — Refs-not-state for live drawing
**Status:** Accepted.
**Context:** Per-point React state updates would cause re-renders and input lag.
**Decision:** Accumulate stroke points in refs; render via `requestAnimationFrame`;
only emit to the store once per finished stroke/segment (`onChange`).
**Consequences:** Near-one-frame input latency; the canvas is an imperative island
inside the React tree. (Doc 04 §1, doc 02 §5.)

### ADR-007 — Content/copy externalized from components
**Status:** Accepted.
**Context:** Copy needs sensitivity review and future i18n; it's also a tuning
surface (instruction wording, notification set).
**Decision:** All player-facing strings + instruction data live in `src/content/`.
**Consequences:** Reviewers and translators never touch components; safer ethics
process. (Doc 02 §2, doc 06 §8.)

### ADR-008 — Experiential-first: defer the ASD reveal to the Reflection (show, don't tell)
**Status:** Accepted.
**Context:** The primary audience knows nothing about autism. Empathy lands
hardest when *felt before explained*; a front-loaded lecture blunts discovery and
can prime stereotypes.
**Decision:** The welcome gives only a minimal, honest setup + sensory-safety
opt-out and does **not** name ASD or state the point. Autism is named and the
lesson stated **only** on the Reflection screen ("the reveal"). Copy lives in
separate `welcome.copy.ts` vs `reveal.ts` so the boundary is structural.
**Consequences:** Maximum experiential impact for newcomers; requires care that
the deferral is never *deceptive* — safety/consent info stays up front and we make
no false claims. (Docs 00 §4, 01 §1.1, 06 §3, 07 §1.)

### ADR-009 — Reframe the primary audience to the "zero-knowledge newcomer"
**Status:** Accepted.
**Context:** The original docs led with facilitators/educators. The product's core
goal is reaching people who *don't* know what ASD is or how it feels.
**Decision:** Make the no-prior-knowledge layperson the primary persona; treat
facilitators/educators as secondary. Every player-facing surface assumes zero
knowledge and no jargon.
**Consequences:** Onboarding hook in seconds, no assumed vocabulary; success
measured by newcomer comprehension (SC-2b). No schema/instrumentation change
(privacy preserved). (Docs 00 §3, 09 §5.)

### ADR-010 — Mode 1 has a hidden target, revealed at Reflection
**Status:** Accepted (supersedes the earlier "no correct answer" stance for Mode 1).
**Context:** The sharpened goal is to show a *simple task is hard to get right*
without clear instructions. Pure ambiguity (no correct answer) doesn't produce the
"I couldn't do the simple thing" feeling.
**Decision:** Both modes aim at the *same* intended result; Mode 1 never makes it
knowable (vague words, no reference). Reflection reveals it and ghosts it behind the
Mode 1 attempt so the gap is visible.
**Consequences:** Stronger goal alignment; demands strict ethics framing — the gap
indicts the *instructions*, never the player (ADR-011; doc 07 §2). (Docs 01 §2/§6, 06 §3.5.)

### ADR-011 — Add the instruction-giver character ("the Grown-up")
**Status:** Accepted.
**Context:** "Without/with direct instructions" is abstract; the goal centers on a
kid given a task by a grown-up.
**Decision:** A single warm character assigns the task in both modes — vague (M1)
vs clear (M2) — plus a gentle "not quite right" beat (M1) and a "Perfect!"
completion (M2). Kind in both modes; only clarity changes.
**Consequences:** Concrete, emotional framing; must never become a villain, blame
the player, or infantilize autistic people (doc 07 §2, principles 6–7). (Docs 01 §2.1, 06.)

### ADR-012 — Capture confidence alongside stress
**Status:** Accepted.
**Context:** Stress alone doesn't capture "I couldn't tell if I did it right,"
which is central to the goal.
**Decision:** Each feedback check also asks confidence (1–10); store
`mode_N_confidence_level`. The Mode-1→Mode-2 confidence gap is the headline signal
(SC-2c). Local-only; no new privacy exposure.
**Consequences:** Two additive schema fields; a second question per check (kept
quick via emoji faces). (Docs 00 §7, 01 §5, 03.)

### ADR-013 — Friendly visual layer: two worlds, custom icons, emoji-face scales
**Status:** Accepted.
**Context:** The docs were functional; the brief asks for "more playable, more
helpful, prettier."
**Decision:** Render Mode 1 and Mode 2 as two distinct visual worlds with a
"fog-clearing" transition; replace inconsistent platform emoji with a custom icon +
face set; use emoji-face scales for stress/confidence; add Mode 2 on-grid guidance
and small reduced-motion-aware micro-interactions.
**Consequences:** Stronger felt contrast and lower input friction; more design/art
work. (Doc 06 §1/§4/§6, doc 04 §2.5.)

## 3. Open questions (live)

| ID | Question | Leaning | Owner/where decided |
|----|----------|---------|---------------------|
| OQ-1 | Canonical drawing subject for both modes | House default + a small task pool | GDD playtest |
| OQ-2 | localStorage vs IndexedDB for drawing payloads | localStorage now, IDB if >150KB/session | ADR-002 / measure on device |
| OQ-3 | Ship image export (FR-14) in v1 or v1.1? | v1.1 unless cheap | Roadmap Phase 8 |
| OQ-4 | Any audio layer in Mode 1? | No (v1) | ADR-005 |
| OQ-5 | Exact Mode 2 step coordinates + grid size (cols×rows) | ~8×10, finalize in Phase 5 | GDD §4 / Phase 5 |
| OQ-6 | Wobble amplitude/frequency final values | start 3px / 0.18, tune in playtest | Phase 4 |
| OQ-7 | Persist in-progress draft for "resume"? | No in v1 (land on Welcome) | doc 03 §3 note |
| OQ-8 | Default language + i18n scope for v1 | English only v1, structure ready | doc 02 §2 |
| OQ-9 | How explicit should the reveal name autism vs "people differ" generally? | Name autism clearly, as *one slice*, never universalized | doc 07 §1 / sensitivity review |
| OQ-10 | Final task pool + each task's grid target coordinates | house default; cat/flower next | Phase 5/7 |
| OQ-11 | The Grown-up's persona, voice, and mascot art | warm teacher/parent; art TBD | Phase 7 / sensitivity review |
| OQ-12 | Confidence scale granularity (1–10 vs 1–5 faces) | faces mapping to 1–10 internally | playtest |

## 4. Change log
- **v1 (this draft):** Initial full blueprint across docs 00–10.
- **v1.1:** Reframed the primary audience to the **zero-knowledge newcomer**;
  adopted **"show, don't tell" / experiential-first**; deferred the ASD **reveal**
  to the Reflection screen; framed the two modes as **"without instruction" vs
  "with instruction."** Added ADR-008/ADR-009, OQ-9, SC-2b, and `welcome.copy.ts`
  / `reveal.ts` content split. Touches docs 00–10 + README.
- **v1.3:** Playability / UX / visual pass on the sharpened goal (*a simple task is
  hard for an ASD kid without direct instructions*): added the **instruction-giver
  character** + "not quite right"/"Perfect!" beats (ADR-011), a **hidden target +
  Reflection reveal** (ADR-010), a **confidence rating + gap** (ADR-012;
  `*_confidence_level`, `task_id`, task pool), **Mode 2 on-grid guidance**,
  **emoji-face feedback scales**, a **top-level progress indicator**, a persistent
  **Mode 1 exit**, and a **two-visual-worlds / custom-icon polish layer** (ADR-013).
  Added FR-16–23, SC-2c, OQ-10–12, and `engine` renderers `drawStepGuidance` /
  `drawTargetGhost`. Touches docs 00, 01, 02, 03, 04, 06, 07, 08, 09, 10 + README.

## 5. Implementation log
First code lands; docs above remain the source of truth. Entries here record what
was *built* against the blueprint and any reconciliations.
- **2026-06-21 — Phase 0 + Phase 1 (PRD-001, PRD-002).** Scaffolded the app
  (Vite + React 18 + TS strict + Tailwind + Zustand; ESLint/Prettier, Vitest,
  Playwright) and built the rigid offline PWA shell and the data model + persisted
  Zustand store — both lifted from the reference code in docs 02/03/05.
  - Reconciliations vs the reference code (no ADRs changed): added a **quota-guarded
    `StateStorage` adapter** (`src/store/storage.ts`) emitting a
    `literally:quota-exceeded` event instead of `createJSONStorage(()=>localStorage)`
    directly (satisfies R02-13/R02-15, keeps the IndexedDB seam); hardened `migrate`
    to shape-validate and fail safe to empty state (R02-9); made `useHaptics`/SW
    registration feature-detected. `partialize`, the FSM, and types match docs 03
    exactly.
  - Verified: `tsc --noEmit`, ESLint, 29 Vitest unit tests (`store/` 97.97% stmts),
    production `vite build` (SW + manifest, ~48 KB gzip JS), Playwright shell E2E on
    Mobile Chrome + Mobile Safari. **Pending hardware:** real-device install/offline/
    haptics/gesture checks (PRD-001 §9, doc 09 §6).
  - Tech debt logged in [`_debt/`](../_debt/): placeholder PWA icons (001),
    quota-recovery UI deferred to screens (002), dev-only esbuild/vite advisory (003).
- **2026-06-21 — Phase 2 (PRD-003).** Built the canvas engine + haptics — the
  riskiest, highest-value piece, de-risked early. Pure `engine/{geometry,wobble,
  snap,render}.ts`, the `useCanvas` hook (one hook, two modes), `useHaptics`, and
  the `Canvas` component — all lifted from the reference code in doc 04 / doc 05 §4.
  - Reconciliations vs the reference code (no ADRs changed): `useCanvas` pointer
    handlers are **stabilized and read live options via an `optsRef`** instead of
    closing over `opts` directly — the reference attaches listeners once but its
    handlers close over `onChange`/`onHaptic`, so an inline screen callback would go
    stale; the ref keeps them fresh without re-binding (still refs-not-state per
    ADR-006). `undo`/`reset` also **emit `onChange`** so the persisted drawing stays
    in sync with the canvas. Haptic patterns + wobble/grid values are sourced from
    `src/config.ts` (the tunables surface). Engine palette mirrors doc 06 §4 tokens
    as local constants (the `styles/tokens.ts` module lands in PRD-004).
  - Verified: `tsc --noEmit`, ESLint clean, **58 Vitest unit tests** (`engine/`
    100% stmts / 97% branch, ≥90% target), production `vite build` (harness
    code-split; main bundle ~48 KB gzip), **14 Playwright touch E2E** on Mobile
    Chrome + Mobile Safari (freehand payload, grid snap segment + snap haptics,
    grid Undo, no-undo-in-freehand, no-scroll-on-canvas). A lazy demo harness
    (`?harness=canvas`) drives the engine in E2E before any mode screen exists
    (screens are PRD-005/006). **Pending hardware:** real-device touch-feel/latency,
    Android snap haptic, and the no-re-render-during-stroke profiler check
    (PRD-003 §9/§10, doc 09 §6) — the project's highest risk.
  - No new tech debt: the work is complete within PRD-003 scope.
- **2026-06-21 — Phase 3 (PRD-004).** Built the design-token system and the
  navigation skeleton — the M1 "walkable skeleton" milestone. `src/styles/tokens.ts`
  (single source, mirrored into `tailwind.config.ts`), the in-store FSM
  (`app/routes.ts` + `app/ScreenRouter.tsx`), all seven screen shells, the shared
  presentational components, and the "two visual worlds" `ModeTheme` seam +
  storm→anchor fog-clear transition. The full flow now walks
  `welcome→…→reflection→history→welcome` with stubs.
  - Reconciliations vs the reference code (no ADRs changed): the `ink` token was
    reclaimed for its doc-06 meaning (drawing stroke `#0f172a`) and the shell base
    moved to a new `bg` token (the Phase-0 stub had aliased `ink→#0b1020`); AppShell
    updated to `bg-bg`/`text-text`. `ModeTheme` applies the saturate/blur/vignette
    treatment to the mode wrapper only (not the whole screen) so dark-shell chrome
    stays legible in both worlds — the per-theme `canvas` color belongs to the
    drawing area, set by each screen. Copy lives in a single `content/strings.ts`
    stub for now; PRD-009 splits it into the reviewed decks (`welcome.copy.ts`,
    `reveal.ts`, …) + the full content test. An early content guard already asserts
    Welcome names no ASD terms (ADR-008).
  - Verified: `tsc --noEmit`, ESLint, Prettier, **71 Vitest unit tests**, **18
    Playwright E2E** (full flow on Mobile Safari + Chrome; FSM pushes no history /
    no URL change — SC-4), production `vite build` (main bundle ~55 KB gzip,
    CanvasDemo still code-split). **Pending hardware:** low-end-device perf of the
    theme filters (blur/saturate) (PRD-004 §10 risk).
  - Tech debt logged: [`_debt/004`](../_debt/004-engine-palette-vs-tokens.md) —
    the PRD-003 engine palette now duplicates / slightly diverges from
    `styles/tokens.ts` (engine `INK #111827` vs token `#0f172a`); reconcile in a
    PRD-003/008 follow-up.
- **2026-06-21 — Phase 5 (PRD-006).** Built **Mode 2 — "Anchor Point"**, the
  structured half of the contrast (independent of Mode 1, which remains a PRD-004
  stub). The real `AnchorPointScreen` measures its drawing area into a shared
  `GridSpec` (`engine/grid.ts` `computeGridSpec`, extracted from the dev harness so
  the snap canvas + guidance overlay can't drift) and composes the snap-to-grid
  `useCanvas` island with three new pieces: `StepInstruction` (one persistent
  literal step at a time, explicit progress, dominant Next + secondary Undo, **no
  timer**), `StepGuidanceCanvas` (a pointer-events-none overlay pulsing the start
  node + ghosting the target move via `drawStepGuidance`, reduced-motion aware),
  and `GiverBeat` (the skippable, non-blocking "Perfect — exactly right!"
  completion moment). The canonical **house** is authored as data in
  `content/mode2.steps.ts` (+ `content/tasks.ts` registry), and on completion the
  grid drawing is saved and the flow advances to Feedback #2.
  - Reconciliations vs the blueprint (no ADRs changed): the _docs/01 §4.2 example
    drew the door/window as multi-segment "boxes" inside one step; here **every
    step is exactly one segment** so guidance ghosts precisely one move per card and
    "Step X of N" maps 1:1 to drawing actions — the house finalized at **9
    single-segment steps** (walls → roof → inverted-U door) on the 8×10 grid, the
    window deferred to PRD-009's task expansion. **Undo Step** both reverts the last
    segment and returns to the prior card (R06-5) in one control (the wireframe's
    single secondary action). The completion beat is shared with PRD-005, so the
    Mode-2 walk in `navigation.test`/`flow.spec` now steps then confirms the beat.
    The screen is jsdom-safe (guarded `ResizeObserver`/`matchMedia`/2D context) so
    the router test mounts it; hidden `mode2-grid-spec`/`mode2-drawing` JSON are an
    E2E inspection seam.
  - Verified: `tsc --noEmit`, ESLint, Prettier, **88 Vitest unit tests** (grid
    layout, house geometry vs target, task resolver, `StepInstruction` no-auto-
    advance + Undo state, `GiverBeat` auto-advance/skip/fire-once), production
    `vite build` (main bundle ~59 KB gzip), **22 Playwright E2E** on Mobile Safari +
    Chrome (build the full house via literal steps, integer-node snap, Undo reverts
    + returns to the prior card, completion → Feedback #2; all prior shell/canvas/
    flow specs still green). **Pending hardware:** Android crisp-snap haptic + iOS
    visual-snap feel (PRD-006 §8, doc 09 §6).
  - Tech debt logged: [`_debt/005`](../_debt/005-unauthored-task-subjects.md) —
    `cat`/`flower` subjects are in the pool but unauthored, so `resolveTask` falls
    back to the house until PRD-009 authors them (FR-20 variety is a pool of one).
- **2026-06-21 — Phase 4 (PRD-005).** Built **Mode 1 — "Sensory Storm"**, the
  "without clear instruction" half of the contrast — the **M2 "playable core"**
  milestone now has both modes. The real `SensoryStormScreen` composes the
  freehand+wobble `useCanvas` island (blank canvas, no grid/guide/reference, **no
  Undo** — strokes are permanent) under the storm `ModeTheme`, with three new
  pieces: `VagueInstruction` (the ask + block that fade from memory with no recall
  control), `FakeNotifications` (mundane toasts on a jittered ~4–8s cadence that
  always auto-dismiss and never trap input), and the shared `GiverBeat` playing the
  gently-puzzled "not quite right" beat before saving the drawing and advancing to
  Feedback #1. Erratic move haptics come from `useHaptics`; the calm **Exit** +
  **reduce-intensity** rails stay reachable through the chaos and verifiably soften
  all four channels (haptics, notifications, fade, vague-text contrast). Mode 1
  copy is authored as data in `content/mode1.ts` (PRD-009 owns the reviewed deck).
  - Reconciliations vs the blueprint (no ADRs changed): the fade is driven by an
    **imperative rAF writing `opacity` directly**, not a CSS transition — the global
    `prefers-reduced-motion` rule (index.css) forces `transition-duration`≈0, which
    would snap the text to invisible, but R05-12 wants it to *still fade gently*
    under reduced-motion (only drift suppressed); a direct style write is immune to
    that rule and costs **zero React re-renders** during the fade (refs-not-state,
    ADR-006), so it never disturbs the canvas's 60fps. **Retuned `config.fade` +
    `config.notifications`** to the GDD (fully-legible ~3s then fade, gone by ~12s;
    notifications `[4000,8000]` jittered) and added reduced-intensity variants
    (raised opacity floor, slower gaps) — the Phase-0 seed values (1.5s/4s,
    `intervalMs`) predated the screen. The pure `fadeOpacity` curve lives in
    `lib/fade.ts` and `usePrefersReducedMotion` (guarded `matchMedia`) in `hooks/`
    so the components stay components-only (no lint warnings). Mode 1's completion
    beat is shared with Mode 2, so the Mode-1 walk in `navigation.test`/`flow.spec`
    now confirms the beat; hidden `mode1-drawing` JSON is the E2E inspection seam.
  - Verified: `tsc --noEmit`, ESLint, Prettier clean, **98 Vitest unit tests**
    (the `fadeOpacity` decay curve, `VagueInstruction` no-recall + raised-contrast,
    `FakeNotifications` cadence/auto-dismiss/non-interactive/paused-while-inactive),
    production `vite build` (main bundle ~60 KB gzip, harness still code-split),
    **26 Playwright E2E** on Mobile Safari + Chrome (wobbly stroke → freehand
    payload, no-undo-in-Mode-1, Done → beat → Feedback #1, reduce-intensity toggles
    + canvas stays drawable, calm Exit → Welcome; all prior shell/canvas/flow/mode2
    specs still green). **Pending hardware:** Android erratic move haptic + iOS
    visual-only feel, and the SC-1 "mildly frustrating not distressing" playtest
    (PRD-005 §9, doc 09 §6).
  - No new tech debt: the work is complete within PRD-005 scope (notification icons
    remain emoji placeholders, already owned by PRD-009's icon set).
- **2026-06-21 — Phases 3–5 (PRD-007).** Built the real feedback check — the single
  screen reused after both modes that captures **stress + confidence** on emoji-face
  scales (ADR-012). The two scales (faces, screen-reader labels, endpoint anchors,
  1–10 values) are authored as data in `content/feedback.ts` (ADR-007); one reused
  `RatingScale` radiogroup (`components/RatingScale.tsx`) renders both questions and
  emits the integer, and `FeedbackCheckScreen` writes `setStress`/`setConfidence`
  immediately against the active mode (stress1→1, stress2→2), finalizing the session
  on check #2 → Reflection. This replaces the PRD-004 `StubScale` placeholder.
  - Reconciliation vs PRD-007 §5 (no ADR changed): **Continue is gated until both
    questions are answered.** The PRD specifies "one Continue" but not gating; left
    ungated, a skipped scale would write a `null` that the confidence gap (SC-2c) and
    the Reflection deltas (PRD-008) then read. Gating is the cheaper guarantee than
    teaching every downstream consumer to tolerate a partial check. Each face's
    accessible name is its **word** ("Calm" … "Very sure"), not a number or color, so
    the scale is never color-only (R07-8); endpoint anchors add a redundant non-color
    direction cue. Confidence wording is strictly neutral — a content test forbids
    failure language ("fail"/"wrong"/"mistake") in any confidence label (R07-3).
  - Verified: `tsc --noEmit`, ESLint, Prettier clean, **116 Vitest unit tests** (+18:
    `content.feedback` scale invariants + neutral wording, `ratingScale` radiogroup +
    a11y labels + emitted value, `feedback` store wiring / gating / mode-1→mode2 vs
    mode-2→finalize→Reflection), and the existing **13 Playwright E2E** on Mobile
    Chrome green (the walkable flow rates both checks through the real screen; all
    prior shell/canvas/flow/mode1/mode2 specs still pass).
  - No new tech debt: the shipped custom face set (R07-9) and final face count
    (OQ-12) are already owned by PRD-011 polish; the emoji placeholders are isolated
    to `content/feedback.ts` so that swap is a one-file change.
- **2026-06-21 — Phase 6 (PRD-008).** Built **Reflection & History — the payoff**,
  completing the **M2 "playable core"** loop. The real `ReflectionScreen` reveals
  the hidden target (`TargetReveal`, ADR-010), shows both attempts side by side via
  a read-only `DrawingPreview` — the Mode 1 freehand with the target **ghosted
  behind it** (`drawTargetGhost`, ADR-013) — the personal **stress + confidence
  deltas** (ADR-012), and **"the reveal"**: the first and only place autism is named
  (ADR-008), authored in the new `content/reveal.ts` with the three required
  disclaimers. `HistoryScreen` lists sessions newest-first with date + stress arc +
  thumbnails and opens the *tapped* one; "Delete all my data" (FR-15) now takes an
  explicit confirm step. Optional **local PNG export** (`lib/exportImage.ts`, FR-14)
  composes the comparison via the shared engine and downloads it — local-only, no
  network. `DrawingPreview` + `exportImage` reuse `engine/render.ts`, so saved work
  re-renders exactly as drawn.
  - Reconciliations vs the blueprint (no ADRs changed): added a runtime-only
    **`selectedSessionId` + `viewSession(id)`** seam to the store (not in
    `partialize`) so Reflection renders either the just-finalized session or one
    opened from History via the new `useReflectionSession` selector (finalize /
    startNewSession / clearAllData clear it). The reveal copy migrated out of the
    `strings` stub into `content/reveal.ts` — now the *only* file allowed to name
    autism — and a content test (`content.reveal`) pins the boundary both ways
    (reveal names it + carries the disclaimers; the neutral `strings` deck names it
    nowhere). Final reveal wording is the drafted slot; PRD-009's sensitivity review
    owns the shipped copy. Previews render on a **light** surface so the dark engine
    ink keeps AA contrast; canvases carry `role=img` + text summaries (a11y).
    **OQ-3 resolved:** image export ships in v1 (cheap, self-contained, feature-
    detected — absent where unsupported).
  - Verified: `tsc --noEmit`, ESLint, Prettier clean, **140 Vitest unit tests** (+24:
    `DrawingPreview`/`TargetReveal` engine wiring + a11y, `Reflection` deltas/reveal/
    fallback, `History` newest-first/open-by-id/confirm-delete, `exportImage`
    supported + graceful-unsupported, `viewSession` + selector, the reveal content
    boundary), production `vite build` (~63 KB gzip JS, well under the ~200 KB
    budget), **Playwright** reflection + flow E2E on Mobile Safari + Mobile Chrome
    (full play → reveal + both previews + both deltas + autism named → reload keeps
    the session → reopen from History re-renders; confirmed delete-all). **Pending
    hardware:** real-device PNG save / OS share, and the reduced-motion reveal feel
    (PRD-008 §9, doc 09 §6).
  - Tech debt logged: [`_debt/006`](../_debt/006-mode1-ink-contrast.md) — building
    the previews surfaced that Mode 1's live freehand ink (`#111827`) is near-
    invisible on the storm canvas (`#11162a`); tuning the Mode 1 surface is PRD-005
    scope, so it's logged rather than fixed mid-PRD (coordinate with `_debt/004`).
- **2026-06-21 — Phase 7 (PRD-009).** Authored **all player-facing content** into the
  canonical `src/content/` layout and passed the **structural** ethics gate. Split
  the scattered copy into the doc-02 §3 files: `welcome.copy.ts` (no-spoiler setup +
  the previously-missing **sensory-safety note** and "we'll explain after" line —
  a consent disclosure, never deferred), `giver.copy.ts` (the Grown-up's vague/clear
  asks + both beats, subject-agnostic), `notifications.ts`, `mode1.instructions.ts`
  (per-subject vague blocks), and a `strings.mode1` chrome group; deleted the interim
  `mode1.ts`. The reveal gained an invite-to-action line.
  - **Task pool closed (FR-20, OQ-10; resolves `_debt/005`):** authored **cat**
    (8-step face + ears) and **flower** (6-step stem + diamond blossom + leaf) in
    `mode2.steps.ts`, each with a vague Mode-1 block; `tasks.ts` now resolves all
    three directly (the `?? house` fallback is gone). This also fixed a **latent
    mismatch**: Mode 1 hard-coded the house ask, so a cat/flower session would have
    asked for a house — `SensoryStorm` now reads `resolveTask(task_id).vague`. Added a
    `mode2-steps` E2E inspection seam so the specs drive any rolled subject; pinned
    `Math.random→0` where `mode2.spec` makes house-specific assertions.
  - **Ethics gate (doc 07 §7):** one `content.boundary.test.ts` enforces the
    show-don't-tell boundary structurally — every neutral deck (strings, welcome,
    giver, notifications, tasks + all Mode 2 step text) names no autism/ASD term, and
    `reveal.ts` is the only place it appears — plus the reveal's three disclaimers,
    identity-first/no-pity language, benign notifications, and the giver never blaming
    the player. The code/content-verifiable gate items are green (incl. a `grep`
    proof of **no runtime network egress**); the **human sensitivity review (R09-12,
    SC-6)** remains a pending release gate, like the "pending hardware" items.
  - Verified: `tsc --noEmit`, ESLint, Prettier clean, **154 Vitest unit tests** (+14:
    cat/flower geometry across all subjects, the closed-pool resolver, the full
    content boundary/ethics scan), production `vite build` (~63 KB gzip JS), **16
    Playwright E2E** on Mobile Safari + Mobile Chrome (subject-agnostic Mode 2 build
    via the steps seam; all prior specs green). **Pending sign-off:** sensitivity
    review of copy + Mode 1 intensity.
  - No new tech debt; `_debt/005` resolved. (Mascot art, OQ-11, stays with PRD-011
    polish.)
- **2026-06-21 — Phase 8 a11y (PRD-010).** Closed the **Accessibility & Sensory
  Safety** PRD's automatable acceptance. The feature PRDs had already built the
  semantics (landmarks, labelled radiogroups, reduced-intensity's four channels,
  reduced-motion paths, the calm exit, 44pt targets); PRD-010 is the **acceptance
  owner**, so the work was to *verify them together* and close the gaps an audit found:
  - **Automated a11y gate (R10-7/8/9):** added `@axe-core/playwright` +
    `tests/e2e/a11y.spec.ts` — scans Welcome, the Stress check, Mode 2, and Reflection
    for serious/critical WCAG A+AA violations on Mobile Chrome + Mobile Safari. **Mode 1
    is excluded by design** (its fading low-contrast text is the R10-7 documented
    exception; auditing it would flag the intended discomfort).
  - **Reconciliation (no ADRs changed):** the gate immediately caught a real **AA
    contrast failure** — the `primary` token `#3b82f6` carries white CTA text at only
    3.67:1 (Welcome "Start", Mode 2 "Next step"). Darkened to blue-600 `#2563eb`
    (5.17:1 on white; still ≥3:1 against the dark surface for the RatingScale ring).
    Token-only change, mirrored into Tailwind. Also gave the **Mode 2 live canvas an
    `aria-label`** (`strings.mode2.canvasLabel`) — Mode 1 had one, Mode 2 didn't (R10-9).
  - Audited and recorded the remaining contract: **no audio** anywhere (R10-5, ADR-005),
    **no >3Hz flashing** (no `setInterval`; all motion rAF at ≥900 ms, R10-4).
  - Verified: `tsc --noEmit`, **154 Vitest unit tests** green (unchanged), **+10
    Playwright a11y assertions** green on both device profiles. **Pending hardware:**
    VoiceOver/TalkBack screen-reader passes + the by-feel reduced-motion/intensity
    checks (`_docs/09` §6), signed off with the human sensitivity review (PRD-009 R09-12).
  - No new tech debt.
- **2026-06-21 — Phase 8 testing/CI + polish (PRD-011).** Closed the **automatable**
  half of the Testing/QA/Launch PRD; the manual gates (real-device matrix R11-6,
  screen-reader R11-4, on-device Lighthouse R11-7/9, newcomer playtest R11-11) stay
  the pre-release human gate, as do the PRD-009 sensitivity review + the "pending
  hardware" feel checks across PRDs 001–010.
  - **CI (R11-13):** added `.github/workflows/ci.yml` — a `quality` job (prettier,
    eslint, `tsc --noEmit`, vitest+coverage, build, bundle budget) and an `e2e` job
    (Playwright on iPhone 13 + Pixel 7, report uploaded). Runs on PRs + pushes to
    main, concurrency-cancels superseded runs. This is the first CI in the repo;
    the automated layers had run only locally.
  - **Bundle budget (R11-8 / NFR-3):** added `scripts/check-bundle-size.mjs`
    (`npm run check:size`) — sums the gzipped size of every `dist/assets/*.js` chunk
    (main + lazy + workbox-window glue) and fails over the ~200 KB ceiling. Current:
    **65.8 KB of 200 KB (33%)**. SW runtime + precached media sit outside the gate.
  - **Zero-latency invariant (R11-7, ADR-006):** the "no React re-render during a
    stroke" claim was only ever checked by hand with the profiler. Added an automated
    stand-in (`tests/unit/useCanvas.render.test.tsx`) that drives a full native-pointer
    stroke through `useCanvas` and asserts the React render count never moves mid-stroke
    (freehand + grid), `onChange` fires exactly once on completion, and a stroke-end
    state write re-renders exactly once.
  - **Polish — app-shipped faces (R11-10 / R07-9; resolves OQ-12's glyph half):**
    replaced the placeholder platform emoji on the rating scales with one parameterized
    `Face` SVG driven by a data `mood` (−2…+2) on each `RatingFace`, so the five faces
    look identical on every device. Static geometry (nothing for reduced-motion to
    collapse); the radio's word still carries meaning (R07-8). The swap was the
    one-file change `content/feedback.ts` was designed for, plus the component + tests.
  - Verified: `tsc --noEmit`, ESLint, Prettier clean, **161 Vitest unit tests** (+7:
    the no-re-render invariant ×3, the `Face` glyph ×4), production `vite build`
    (65.8 KB gzip JS, budget-checked), **40 Playwright E2E** green on Mobile Safari +
    Mobile Chrome (full suite, incl. the feedback flow through the new faces).
  - No new tech debt. Remaining PRD-011 items are the manual/hardware gates above and
    the PWA-icon art (`_debt/001`, OQ-11 mascot) — design work, not code.
- **2026-06-21 — Tech-debt cleanup pass.** Worked the `_debt/` backlog now that the
  screens/design-system it was waiting on exist. Resolved notes moved to
  `_debt/archive/`; no ADRs changed. Three items closed, one was already done, two
  stay open by design:
  - **DEBT-002 (quota-recovery UI):** wired the missing listener. `store/storage.ts`
    already guarded writes and dispatched `literally:quota-exceeded`; added a global
    `QuotaNotice` (mounted in `App` over the `ScreenRouter`) that surfaces a calm
    "out of room — clear older sessions?" prompt, plus a focused `clearOldSessions`
    store action that keeps only the newest session (so recovery never discards the
    result the player is about to view, unlike `clearAllData`). +5 unit tests.
  - **DEBT-004 (engine palette vs tokens):** `engine/render.ts` now sources its
    palette from `styles/tokens.ts` (single source of truth) instead of drifted local
    hex; committed strokes reconcile to `tokens.color.ink` (`#0f172a`). `tokens.ts` is
    plain data, so the engine stays pure.
  - **DEBT-006 (Mode 1 ink invisible, Medium):** added distinct `stormInk` (≈3.1:1 —
    legible yet effortful) / `stormInkReduced` (≈5:1) tokens; `drawFreehand` takes an
    optional `ink`, threaded through `useCanvas`; `SensoryStormScreen` raises the
    stroke ink under reduced-intensity alongside the other R05-11 channels. Saved
    previews (light surface) keep the committed ink. +1 unit test.
  - **DEBT-005** was already resolved in PRD-009 — moved to archive.
  - **Still open (deferred by design):** `_debt/001` PWA-icon art (blocked on the P2
    mascot/brand direction, OQ-11) and `_debt/003` esbuild/vite dev-server advisory
    (dev-only; the only fix is a breaking Vite-8 major needing `vite-plugin-pwa`
    support — a toolchain migration for the PRD-011/CI-hardening track, zero prod
    exposure under ADR-001).
  - Verified: `tsc --noEmit`, ESLint clean, **167 Vitest unit tests** green,
    production `vite build` (64.65 KB gzip JS, budget-checked).
- **2026-06-22 — DEBT-007 resolved (Vite-8 toolchain upgrade).** Did the coordinated
  Vite-major migration the prior pass deferred — taken to the **latest** stable line
  (not the minimal 6/7 bump) since PRD-011, the deferral target, had already shipped.
  One atomic dependency change: `vite` `^5.4.10`→`^8.0.16`, `@vitejs/plugin-react`
  `^4`→`^6` (peer-requires Vite 8), `vite-plugin-pwa` `^0.20.5`→`^1.3.0`, and
  `vitest`/`@vitest/coverage-v8` `^2`→`^4`. No app code or config changed — the
  `vite.config.ts` PWA/test blocks and the build/test scripts carried over as-is.
  - **`esbuild` override removed (DEBT-003 now structurally moot).** Vite 8 bundles
    via **rolldown** and vitest 4 dropped esbuild, so `npm ls esbuild` is empty; the
    `overrides: { esbuild: ^0.25.0 }` that resolved DEBT-003 matched nothing and was
    deleted. The advisory it capped (GHSA-67mh-4wv8-2f99) is now eliminated, not
    merely overridden. No ADRs changed; ADR-001 (no runtime server) is why all of
    this was dev-only — production ships static precached files, unchanged.
  - Verified: `npm audit` **0 vulnerabilities** (was 6, all Vite ≤ 6.4.2); `tsc
    --noEmit` + `vite build` green (SW + manifest generated; **65.07 KB gzip JS**,
    *smaller* than before, within the 200 KB NFR-3 budget); **167 Vitest unit tests**;
    **40 Playwright E2E** on Mobile Safari + Mobile Chrome; ESLint clean; Vite 8 dev
    server boots (80 ms) → 200. CI Node 22 already meets the raised engine floors
    (Vite 8 ≥ 22.12, vitest 4 ^22), so no workflow change.
  - **Still pending hardware (unchanged):** a `vite-plugin-pwa` major touches
    service-worker generation, so re-run the real-device PWA install / true-offline
    matrix (`_docs/09` §6) before release. `_debt/001` (PWA-icon art, OQ-11 mascot)
    stays open by design — no code action until brand art lands.
