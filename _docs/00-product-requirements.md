# 00 — Product Requirements Document (PRD)

**Product:** "Literally"
**Type:** Serious / educational game (empathy simulator)
**Platform:** Mobile-first Progressive Web App (PWA), offline, frontend-only
**Status:** Draft v1 — blueprint

---

## 1. Problem & opportunity

Most people process instructions by filling gaps with assumptions, ignoring
irrelevant sensory noise, and tolerating ambiguity automatically. For many people
on the Autism Spectrum, that automatic gap-filling is effortful or different:
vague instructions create genuine uncertainty, and ambient sensory input is not
easily filtered out. Neurotypical people rarely *experience* this difference —
they only hear it described.

**Opportunity:** A short, visceral, hands-on game can let a player *feel* the gap
between "processing instructions under ambiguity + sensory load" and "processing
instructions that are literal, structured, and predictable." Felt experience
builds empathy far more durably than reading a description.

**Who we're really building for:** the person who has **never thought about
autism** and couldn't tell you how an autistic person experiences the world.
You cannot lecture that person into empathy — descriptions slide off. But you can
hand them a phone, have them *do* a task twice, and let the difference hit them in
their own body. We teach by experience, not explanation: **show, don't tell.**

## 2. Goal & non-goals

### Goals
- **G1 — Empathy through *felt* contrast, starting from zero.** The primary
  player may know nothing about autism. They perform the same task in two opposite
  conditions and *feel* the emotional difference firsthand. **We show, we don't
  tell:** no lecture, no jargon, and no explanation of "what autism is" before
  they play — the meaning is revealed only afterward (see [01](./01-game-design.md) §1.1).
- **G2 — Make it personal & reflective.** End on self-rated stress and a
  side-by-side comparison the player produced themselves.
- **G3 — Work anywhere, instantly.** Installable PWA, fully offline, no account,
  no setup, no data leaves the device.
- **G4 — Feel native-quality on a phone.** Immediate touch, satisfying haptics,
  portrait-locked, no accidental browser gestures.

### Non-goals (explicitly out of scope)
- **NG1 — Not a diagnostic or assessment tool.** It measures nothing clinical.
- **NG2 — Not a claim of universality.** It simulates *one* illustrative slice,
  not "the autistic experience." (See [07](./07-accessibility-and-ethics.md).)
- **NG3 — No backend / accounts / cloud sync / analytics-by-default.** v1 is
  strictly local. (Optional anonymous export is a *future* idea, not v1.)
- **NG4 — No multiplayer, no leaderboards, no monetization.**

## 3. Target audience

| Segment | Why they play | Implication for design |
|---------|---------------|------------------------|
| **Newcomers with no ASD knowledge (PRIMARY)** | Curiosity; a friend's "just try this" | Zero assumed knowledge; no jargon; hook in seconds; the lesson must land *without* being taught |
| Curious general public | "What's it like?" | Low friction, fast, no sign-up |
| Family & friends of autistic people | Understand a loved one | Gentle on-ramp; "this is one perspective" framing |
| Educators / trainers | Run an empathy exercise in class or a workshop | Explainable in <1 min; shareable link/install |
| HR & DEI / workplace inclusion | Neurodiversity training | Professional, respectful tone; no condescension |
| Autistic self-advocates | Validate/share their experience | Authenticity matters; co-design & sensitivity review |

> **Primary persona — "The Curious Newcomer":** has never really thought about
> autism and couldn't say how an autistic person might experience the world. A
> friend sends a link — "just try this, it takes 3 minutes." They open it cold,
> with no setup and no patience for a lecture. Success is that *by the end* they
> *felt* something real and can say, unprompted, "oh — that's what it can be
> like," **without anyone having explained it to them up front.**
>
> **Secondary persona — "The Facilitator":** runs it as a 3–5 minute workshop
> activity; needs it to work on any attendee's phone, offline, with the two
> drawings + stress scores as a discussion artifact.

## 4. The player journey (happy path)

1. **Open** the app cold. Land on a calm welcome with a *minimal*, honest setup —
   "a short hands-on experience; just follow the instructions and notice how it
   feels; we'll explain at the end" — plus a sensory-safety opt-out. We
   deliberately do **not** name autism or state the point yet (show, don't tell).
2. **Mode 1 — Sensory Storm.** A warm grown-up sets a *simple* task ("draw your
   house for art class") but only vaguely, showing no reference. Draw on a blank
   wobbly canvas under haptic/visual noise; you're never told what "right" is. On
   finishing, the grown-up is gently puzzled — "not quite what I meant…".
3. **Feedback check 1.** Rate stress *and* how sure you were you did it right
   (friendly emoji scale).
4. **Mode 2 — Anchor Point.** The *same* grown-up sets the *same* task, now
   crystal-clear: one literal step at a time on a snap-to-grid canvas, the next
   move highlighted, with Undo and crisp haptics. It completes with a satisfying
   "Perfect!".
5. **Feedback check 2.** Rate stress and confidence again.
6. **Reflection — the reveal.** See both drawings side by side *with the intended
   result revealed* (the target you were never clearly shown), plus both stress
   and confidence scores; *now*, for the first time, we name what just happened —
   how vague instructions + sensory load make a simple task hard for an autistic
   child, and why clear, literal communication is accessibility. The lesson is
   delivered only *after* it has already been felt.
7. **Save & revisit.** Session is stored locally; player can view past sessions
   or start again. Optionally export/share an image of the comparison.

Detailed second-by-second design is in [01-game-design.md](./01-game-design.md).

## 5. Functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Two playable modes with the mechanics defined in GDD §2–3 | P0 |
| FR-2 | Freehand drawing with applied stroke wobble/noise (Mode 1) | P0 |
| FR-3 | Snap-to-grid dot-connecting with grid render (Mode 2) | P0 |
| FR-4 | Step-by-step instruction pagination with Next/Undo (Mode 2) | P0 |
| FR-5 | Vague fading/scrolling instruction block (Mode 1) | P0 |
| FR-6 | Haptics: erratic on `touchmove` (M1); crisp on snap (M2) | P0 |
| FR-7 | Fake distraction notifications during Mode 1 | P1 |
| FR-8 | Stress **and confidence** self-rating after each mode (friendly emoji scale) | P0 |
| FR-9 | Reflection: side-by-side drawings, **intended-target reveal**, stress+confidence deltas, debrief | P0 |
| FR-10 | Persist `GameSession` locally; survives reload/offline | P0 |
| FR-11 | History list of past sessions; view a past session | P1 |
| FR-12 | Installable, offline-capable PWA | P0 |
| FR-13 | Portrait lock + browser-gesture blocking | P0 |
| FR-14 | Export comparison as an image (share/save) | P2 |
| FR-15 | Clear all local data (privacy control) | P1 |
| FR-16 | Instruction-giver character framing the task — vague (M1) vs clear (M2) | P1 |
| FR-17 | Hidden intended target (identical in both modes); revealed at Reflection | P0 |
| FR-18 | Mode 2 on-grid visual guidance (pulsing start node + ghost target path) | P1 |
| FR-19 | Mode 2 completion moment + gentle "not quite right" beat (M1) | P1 |
| FR-20 | Task-variety pool (e.g. house / cat / flower) chosen per session | P2 |
| FR-21 | Top-level progress indicator across the flow | P2 |
| FR-22 | Persistent Exit / reduce-intensity control within Mode 1 | P0 |
| FR-23 | Two distinct visual themes (storm vs anchor) + transition between them | P1 |

## 6. Non-functional requirements

- **NFR-1 Performance:** First paint < 2s on mid-range phone; canvas input→ink
  latency target < ~16ms (one frame). 60fps drawing.
- **NFR-2 Offline:** All assets cached after first load; no runtime network
  dependency. Works in airplane mode.
- **NFR-3 Footprint:** Initial JS payload lean (Vite + tree-shaking; target
  < ~200KB gzipped app code, excluding fonts/icons).
- **NFR-4 Privacy:** No PII, no network egress, no third-party trackers. Data is
  local-only; user can wipe it.
- **NFR-5 Compatibility:** Latest 2 versions of mobile Safari (iOS) & Chrome
  (Android). Graceful degradation where `navigator.vibrate` is unsupported
  (notably iOS Safari — see [05](./05-pwa-and-mobile-shell.md) §Haptics).
- **NFR-6 Accessibility:** Respect `prefers-reduced-motion`; provide a way to
  reduce/disable the Mode-1 intensity for safety (see [07](./07-accessibility-and-ethics.md)).
- **NFR-7 Resilience:** Corrupt/oversized localStorage handled gracefully
  (versioned schema + migration, quota guard — see [03](./03-data-model-and-state.md)).

## 7. Success criteria

Because v1 ships no analytics, success is validated qualitatively in playtests:

- **SC-1 Felt contrast:** ≥80% of playtesters report Mode 1 felt notably more
  stressful/ambiguous than Mode 2 (self-reported, post-play).
- **SC-2 The "aha":** Majority can articulate the empathy point unprompted at the
  reflection screen.
- **SC-2b Lands cold, without teaching:** Among playtesters who reported *no prior
  understanding* of ASD, a majority can — after playing, and without having been
  told the point beforehand — describe in their own words one concrete way the two
  experiences differed and why clearer communication helps.
- **SC-2c Confidence gap:** A majority report markedly lower confidence after Mode
  1 than after Mode 2 — concrete evidence they couldn't tell whether they'd done
  the simple task right without clear instructions.
- **SC-3 Frictionless:** A first-time user reaches Mode 1 drawing in < 30s with
  no instructions from a facilitator.
- **SC-4 Feels native:** No reports of pull-to-refresh, accidental back-swipe,
  text selection, or input lag during playtests.
- **SC-5 Survives reload:** Closing and reopening mid/after a session never loses
  saved data.
- **SC-6 Respectful:** Passes sensitivity review (ideally with autistic
  reviewers); no playtester reports the framing as mocking or reductive.

## 8. Risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS Safari lacks `navigator.vibrate` | Mode-1 haptic layer absent on iPhone | Treat haptics as enhancement; lean on visual+motion noise; document gap |
| Simulation feels like mockery | Reputational / ethical harm | Honest framing, sensitivity review, intensity controls (see 07) |
| Mode 1 too intense (sensory safety) | Distress for sensitive users | Pre-warning, "calm exit," reduced-motion respect, no audio shock |
| localStorage quota / corruption | Lost sessions | Versioned schema, size guard, IndexedDB fallback option |
| PWA install UX varies by browser | Confusion | In-app install guidance per platform |

## 9. Assumptions & open questions

**Assumptions**
- A single shared "drawing goal" (e.g., *a house*) is used across both modes so
  the comparison is meaningful.
- One player, one device, local session only for v1.

**Open questions (track in [10](./10-glossary-and-decisions.md))**
- OQ-1: Final canonical drawing subject for both modes? (Proposal: a house.)
- OQ-2: Persistence engine — localStorage via Zustand `persist` vs IndexedDB
  for drawing path payloads? (See [03](./03-data-model-and-state.md) for the call.)
- OQ-3: Do we ship the image-export (FR-14) in v1 or v1.1?
- OQ-4: Is there an audio layer in Mode 1, or motion/haptics only? (Lean: no
  startling audio in v1 for sensory safety.)
