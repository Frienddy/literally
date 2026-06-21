# 09 — Testing & QA

What we test, with which tools, and the device matrix. Because this is an
offline, touch-and-haptics, sensory app, **real-device testing is mandatory** —
emulators can't validate haptics, true offline install, or touch feel.

---

## 1. Test pyramid

```
        ▲  E2E / device (Playwright mobile emulation + manual real-device)
       ▲▲   — full flows, touch draw, snap, offline, install
      ▲▲▲   Component (React Testing Library)
     ▲▲▲▲    — screens render, transitions, stress input, Mode 2 pagination
    ▲▲▲▲▲   Unit (Vitest)  ← widest, fastest
   ▲▲▲▲▲▲    — engine/* (pure), store lifecycle, migrations, geometry
```

## 2. Unit tests (Vitest)

Pure logic in `engine/` and `store/` — fast, deterministic, high coverage.

- **`geometry.ts`**: `dist`, `simplify` reduces point count while keeping shape
  within epsilon, `quantize` rounds correctly.
- **`wobble.ts`**: `applyWobble` is deterministic for a fixed seed (same input →
  same output); displacement bounded by `amplitude`; zero when `prev` is null.
- **`snap.ts`**: `snapToNode` returns nearest node and clamps to bounds;
  `nodeToPixel` round-trips; `isWithinSnap` true only inside tolerance.
- **`gameStore.ts`**: start→saveMode1→stress(1)→confidence(1)→saveMode2→stress(2)→
  confidence(2)→finalize yields a complete `GameSession` in `sessions[0]`; stress
  *and* confidence clamp to 1–10; `task_id` is set and shared by both modes;
  `deleteSession`/`clearAllData`; `partialize` excludes `screen`/`draft`.
- **`migrations.ts`**: unknown/corrupt blob falls back to empty state, never throws.

Target: ≥90% coverage on `engine/` and `store/` (the logic that, if wrong,
silently corrupts saved drawings).

## 3. Component tests (React Testing Library)

- Welcome renders framing + "Reduce intensity" toggle persists to store.
- `RatingScale`: selecting a face calls `setStress`/`setConfidence` with the right
  integer; faces are labeled for screen readers.
- Mode 2 `StepInstruction`: shows one card; "Next" advances; "Back" returns;
  progress "Step X of N" correct; no auto-advance/timer.
- `FlowProgress` reflects the current screen.
- Reflection renders both `DrawingPreview`s, the **target reveal**, and both
  stress **and confidence** values from a seeded session.
- History lists sessions newest-first; "Delete all data" clears and confirms.

## 4. E2E tests (Playwright, mobile emulation)

Use device descriptors (e.g., iPhone 13, Pixel 7) with touch enabled.

- **Full happy path:** welcome → draw in Mode 1 → feedback (stress+confidence) →
  draw Mode 2 (drag across nodes) → feedback → reflection shows two drawings +
  the intended-target reveal + both scores → reload → session still in history.
- **Freehand capture:** simulate a pointer stroke → assert `onChange` produced a
  freehand drawing with >1 stroke point after simplify.
- **Snap capture:** drag from node A to node B → assert one grid segment
  `{from,to}` with integer nodes.
- **No Undo in Mode 1 / Undo works in Mode 2.**
- **Persistence:** finalize a session, reload the page, assert it's in History.
- **Gesture blocking:** attempt scroll/overscroll on canvas → page doesn't scroll.

> Note: Playwright can emulate touch but **cannot** validate real haptics or true
> PWA install — those are manual (§6).

## 5. Accessibility tests

- Automated: `axe-core` (via `@axe-core/playwright`) on Welcome, Stress, Mode 2,
  Reflection — zero serious violations on non-deliberate surfaces. (Mode 1 vague
  text contrast is an intentional, documented exception — doc 07 §4.)
- Manual: VoiceOver (iOS) + TalkBack (Android) pass over framing/stress/Mode2/
  reflection; verify stress values and step cards are announced.
- `prefers-reduced-motion`: enable in OS → confirm no drifting/auto-scroll;
  Mode 1 still conveys discomfort via content, not motion.
- Reduced-intensity toggle: verify it measurably softens Mode 1 (no erratic
  haptic, fewer/slower notifications, raised text contrast).
- **Newcomer comprehension (qualitative — ties to SC-2b):** with 3–5 testers who
  self-report *no prior ASD knowledge*, confirm that (a) the welcome did **not**
  tip them off to the topic, and (b) after the reveal they can restate, in their
  own words, one concrete difference and why clear communication helps — without
  having been taught it beforehand.

## 6. Manual real-device matrix (mandatory)

| Check | iPhone (Safari) | iPhone (installed PWA) | Android (Chrome) | Android (installed PWA) |
|-------|:---:|:---:|:---:|:---:|
| Installs to home screen | ☐ | — | ☐ | — |
| Works fully offline (airplane mode) | ☐ | ☐ | ☐ | ☐ |
| Portrait lock / PortraitGuard | ☐ | ☐ | ☐ | ☐ |
| No pull-to-refresh | ☐ | ☐ | ☐ | ☐ |
| No text selection / callout | ☐ | ☐ | ☐ | ☐ |
| No double-tap / pinch zoom | ☐ | ☐ | ☐ | ☐ |
| Edge-swipe-back doesn't exit mid-game | ☐ | ☐ | ☐ | ☐ |
| Drawing latency feels instant (60fps) | ☐ | ☐ | ☐ | ☐ |
| Erratic haptic on Mode 1 draw | n/a* | n/a* | ☐ | ☐ |
| Crisp haptic on Mode 2 snap | n/a* | n/a* | ☐ | ☐ |
| Safe-area insets respected (notch) | ☐ | ☐ | ☐ | ☐ |
| Data survives force-quit + reopen | ☐ | ☐ | ☐ | ☐ |

\* iOS Safari has no Web Vibration — verify the **visual** feedback still carries
Mode 1 discomfort and Mode 2 satisfaction (doc 05 §4, ADR-003).

Test on at least one **small** screen (e.g., iPhone SE) and one **large**
(e.g., Pixel 7 Pro) to validate the responsive/side-by-side reflection layout.

## 7. Performance checks

- DevTools Performance: input→ink under ~16ms; no long tasks during a stroke.
- No React re-renders during a stroke (React DevTools profiler shows the canvas
  parent stable while drawing — confirms the refs-not-state design, doc 04 §1).
- Lighthouse (mobile): **PWA installable ✓**, **offline ✓**, Performance ≥90,
  Best Practices ≥95.
- Bundle size budget enforced (PRD NFR-3) — fail CI if app JS exceeds target.

## 8. CI

- On PR: typecheck + ESLint + Vitest + Playwright (headless mobile emulation) +
  bundle-size budget.
- Real-device matrix (§6) + screen-reader passes are a **pre-release manual
  gate**, run before each public release alongside the ethics gate (doc 07 §7).

## 9. Edge cases to script

- Reload mid-session (draft not persisted by default → lands on Welcome cleanly).
- localStorage full → friendly quota error, no crash (doc 03 §6).
- Corrupt persisted blob → migration fallback to empty, app still boots.
- Rotate device mid-draw → PortraitGuard shows, returns to intact canvas in
  portrait (DPR re-fit, no lost strokes within the active screen).
- Rapid double-tap on "Next"/"Done" doesn't skip or double-submit.
- **Welcome must not spoil the topic** — add a content unit test asserting the
  `welcome.copy.ts` strings contain no autism/ASD terms (the reveal is on
  Reflection only; doc 07 §1).
- `task_id` + both confidence levels persist and reload correctly; reflection
  reveals the *right* task's target.
- The "not quite right" beat is brief and **skippable**; it never blocks progress.
- Mode 2 guidance highlights the **correct** start node/target for the current step.
