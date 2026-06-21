# PRD-000 — Product Overview & Scope

| | |
|---|---|
| **Status** | Ready |
| **Product** | "Literally" — a mobile-first, offline empathy game (PWA) |
| **Source docs** | [00](../_docs/00-product-requirements.md), [01](../_docs/01-game-design.md), [10](../_docs/10-glossary-and-decisions.md) |
| **Roadmap** | All phases (this is the umbrella PRD) |
| **Depends on** | — |

---

## 1. Objective

Ship a frontend-only, installable PWA that builds empathy for how unclear
instructions + sensory load make a *simple* task hard — **by letting the player
feel it, not by explaining it**. The player draws the same subject twice: once
under **Mode 1 "Sensory Storm"** (vague fading instructions, wobbly strokes,
erratic haptics, fake notifications, no undo) and once under **Mode 2 "Anchor
Point"** (high-contrast grid, snap-to-grid, one literal step at a time, undo,
crisp haptics). They rate stress and confidence after each, then compare on a
Reflection screen where — for the first and only time — autism is named (**the
reveal**). The contrast *is* the lesson.

## 2. Background & the core thesis

The whole product is **one contrast**: the same task, performed *without* clear
instruction vs *with* clear instruction. We never tell the player "this is what
autism is like"; the difference between the two playthroughs speaks for itself.
The primary audience knows nothing about autism, so the meaning is revealed only
*after* it is felt. See [01 §1](../_docs/01-game-design.md) and
[ADR-008](../_docs/10-glossary-and-decisions.md).

## 3. Personas

| Persona | Need | Design implication |
|---------|------|--------------------|
| **The Curious Newcomer** (PRIMARY) | A friend said "just try this, 3 min." Knows nothing about ASD, no patience for a lecture. | Zero assumed knowledge, no jargon, hook in seconds, lesson lands *without* being taught. |
| The Facilitator (secondary) | Run a 3–5 min workshop activity on any phone, offline. | Works offline on any device; two drawings + scores are a discussion artifact. |
| Family / friends of autistic people | Understand a loved one. | Gentle "one perspective" framing. |
| Autistic self-advocates | Authentic, respectful representation. | Sensitivity review; "one slice, not the experience." |

Full segment table: [00 §3](../_docs/00-product-requirements.md).

## 4. Goals & non-goals

### Goals
- **G1 — Empathy through felt contrast, starting from zero.** No lecture, no
  jargon before play; meaning revealed only afterward.
- **G2 — Personal & reflective.** End on self-rated stress + confidence and a
  side-by-side comparison the player produced.
- **G3 — Work anywhere, instantly.** Installable PWA, fully offline, no account,
  no data leaves the device.
- **G4 — Native-quality on a phone.** Immediate touch, satisfying haptics,
  portrait-locked, no accidental browser gestures.

### Non-goals
- **NG1** Not a diagnostic/assessment tool.
- **NG2** Not a claim of universality (one slice, not "the autistic experience").
- **NG3** No backend / accounts / cloud sync / analytics-by-default. v1 is local.
- **NG4** No multiplayer, leaderboards, or monetization.

## 5. The player journey (happy path)

`Welcome → Mode 1 → Feedback #1 → Mode 2 → Feedback #2 → Reflection (the reveal)
→ Save & revisit`. Detailed second-by-second design: [01](../_docs/01-game-design.md).
FSM values: `welcome → mode1 → stress1 → mode2 → stress2 → reflection → (history | welcome)`.

## 6. Release scope (v1)

**In scope (P0/P1):** both modes, freehand+wobble, snap-to-grid, step pagination,
vague fading instructions, erratic + crisp haptics, fake notifications,
stress+confidence checks, reflection with target reveal + debrief, local
persistence + history, installable offline PWA, portrait lock + gesture blocking,
instruction-giver framing + beats, hidden target, Mode 2 guidance, persistent
Mode 1 exit / reduce-intensity, two visual themes.

**Deferred to v1.1 (P2):** image export (FR-14), additional task subjects beyond
the canonical one if not ready, richer art for the mascot.

Priority levels per requirement live in [00 §5](../_docs/00-product-requirements.md)
and are carried into each feature PRD.

## 7. Success criteria (validated qualitatively in playtests — no analytics)

| ID | Criterion |
|----|-----------|
| SC-1 | ≥80% of playtesters report Mode 1 felt notably more stressful/ambiguous than Mode 2. |
| SC-2 | Majority can articulate the empathy point unprompted at Reflection. |
| SC-2b | Among testers with **no prior ASD knowledge**, a majority can — after playing, untaught — describe one concrete difference and why clearer communication helps. |
| SC-2c | Majority report markedly lower confidence after Mode 1 than Mode 2 (the confidence gap). |
| SC-3 | A first-time user reaches Mode 1 drawing in < 30s without facilitator help. |
| SC-4 | No reports of pull-to-refresh, back-swipe, text selection, or input lag. |
| SC-5 | Closing/reopening mid- or post-session never loses saved data. |
| SC-6 | Passes sensitivity review; no playtester finds the framing mocking/reductive. |

## 8. Non-functional requirements (product-wide)

| ID | Requirement |
|----|-------------|
| NFR-1 | First paint < 2s on mid-range phone; input→ink latency < ~16ms; 60fps drawing. |
| NFR-2 | All assets cached after first load; works in airplane mode; no runtime network. |
| NFR-3 | Lean payload: target < ~200KB gzipped app code (excl. fonts/icons). |
| NFR-4 | No PII, no network egress, no third-party trackers; user can wipe data. |
| NFR-5 | Latest 2 versions of mobile Safari (iOS) + Chrome (Android); graceful where `vibrate` unsupported. |
| NFR-6 | Respect `prefers-reduced-motion`; reduce/disable Mode 1 intensity for safety. |
| NFR-7 | Corrupt/oversized storage handled gracefully (versioned schema + migration + quota guard). |

## 9. Architecture invariants (do not break — see CLAUDE.md & ADRs)

1. **Local-first, network-never at runtime** (ADR-001).
2. **Refs-not-state for live drawing** — React must not re-render per pointer
   event (ADR-006).
3. **Show, don't tell** — defer the ASD reveal; welcome copy must not name ASD
   (ADR-008).
4. **Haptics are enhancement, never a dependency** (ADR-003).
5. **Rigid mobile shell** — block pull-to-refresh, overscroll, selection, zoom;
   portrait enforced (ADR-004).
6. **Content is data, not JSX** (ADR-007).
7. **Navigation is an in-store FSM, not a URL router.**

## 10. Milestones

| Milestone | PRDs | Outcome |
|-----------|------|---------|
| **M1 — Walkable skeleton** | 001–004, 007(stub) | Installable PWA, persists data, full flow with stubs. |
| **M2 — Playable core** | 005, 006, 007, 008 | Both modes + feedback + reflection fully functional. |
| **M3 — Reviewed & shippable** | 009, 010, 011 | Copy + ethics done, accessible, polished, QA-passed. |

## 11. Risks & mitigations (product-level)

| Risk | Mitigation | Owner PRD |
|------|-----------|-----------|
| iOS Safari lacks `navigator.vibrate` | Haptics as enhancement; lean on visual+motion; document gap. | 003, 010 |
| Simulation feels like mockery | Honest framing, sensitivity review, intensity controls. | 009, 010 |
| Mode 1 too intense (sensory safety) | Pre-warning, calm exit, reduced-intensity, reduced-motion, no shock audio. | 005, 010 |
| localStorage quota / corruption | Simplify+quantize, quota guard, versioned migrations, IndexedDB seam. | 002 |
| PWA install UX varies by browser | In-app, platform-aware install guidance. | 001 |

## 12. Open questions (live — tracked in [10 §3](../_docs/10-glossary-and-decisions.md))

OQ-1 canonical subject + task pool · OQ-2 localStorage vs IndexedDB · OQ-3 image
export v1 vs v1.1 · OQ-4 audio (leaning no) · OQ-5 Mode 2 coords + grid size ·
OQ-6 wobble values · OQ-7 resume draft (no in v1) · OQ-8 i18n scope (EN only v1) ·
OQ-9 how explicit the reveal names autism · OQ-10 final task pool + targets ·
OQ-11 mascot persona/art · OQ-12 confidence scale granularity.
