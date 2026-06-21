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
